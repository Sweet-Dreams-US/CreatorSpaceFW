"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin, ADMIN_EMAILS } from "@/lib/admin";
import { verifyTurnstileToken } from "@/lib/turnstile";

interface InquiryData {
  business_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  project_description: string;
  budget_range?: string;
  timeline?: string;
  creator_types: string[];
  turnstileToken: string;
}

export async function submitInquiry(data: InquiryData) {
  // Verify Turnstile
  const tokenValid = await verifyTurnstileToken(data.turnstileToken);
  if (!tokenValid) return { error: "CAPTCHA verification failed" };

  const { error } = await getSupabaseAdmin().from("business_inquiries").insert({
    business_name: data.business_name,
    contact_name: data.contact_name,
    email: data.email,
    phone: data.phone || null,
    project_description: data.project_description,
    budget_range: data.budget_range || null,
    timeline: data.timeline || null,
    creator_types: data.creator_types,
  });

  if (error) return { error: error.message };

  // Send notification email to admins
  try {
    const { sendInquiryNotification } = await import("@/lib/email");
    await sendInquiryNotification({
      business_name: data.business_name,
      contact_name: data.contact_name,
      email: data.email,
      project_description: data.project_description,
      creator_types: data.creator_types,
    });
  } catch {
    // Don't fail the submission if email fails
  }

  return { success: true };
}

export async function getInquiries(statusFilter?: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return [];

  let query = getSupabaseAdmin()
    .from("business_inquiries")
    .select("*")
    .order("created_at", { ascending: false });

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const { data } = await query;
  return data || [];
}

export async function getInquiry(inquiryId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return null;

  const { data } = await getSupabaseAdmin()
    .from("business_inquiries")
    .select("*")
    .eq("id", inquiryId)
    .single();

  return data;
}

export async function updateInquiryStatus(inquiryId: string, status: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("business_inquiries")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  if (error) return { error: error.message };
  revalidatePath("/admin/inquiries");
  return { success: true };
}

export async function updateInquiryNotes(inquiryId: string, notes: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("business_inquiries")
    .update({ admin_notes: notes, updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  if (error) return { error: error.message };
  return { success: true };
}

export async function referCreators(inquiryId: string, creatorIds: string[]) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("business_inquiries")
    .update({
      referred_creators: creatorIds,
      status: "referred",
      updated_at: new Date().toISOString(),
    })
    .eq("id", inquiryId);

  if (error) return { error: error.message };
  revalidatePath("/admin/inquiries");
  return { success: true };
}

// Refer an inquiry to a specific creator — creates a private job lead and sends email
export async function referInquiryToCreator(
  inquiryId: string,
  creatorId: string,
  note?: string
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  // Get inquiry details
  const { data: inquiry } = await getSupabaseAdmin()
    .from("business_inquiries")
    .select("*")
    .eq("id", inquiryId)
    .single();
  if (!inquiry) return { error: "Inquiry not found" };

  // Get creator details
  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, auth_id")
    .eq("id", creatorId)
    .single();
  if (!creator) return { error: "Creator not found" };

  // Create referral record
  const { error } = await getSupabaseAdmin()
    .from("inquiry_referrals")
    .insert({
      inquiry_id: inquiryId,
      creator_id: creatorId,
      note: note || null,
    });

  if (error) {
    if (error.code === "23505") return { error: "Already referred to this creator" };
    return { error: error.message };
  }

  // Update inquiry status
  await getSupabaseAdmin()
    .from("business_inquiries")
    .update({ status: "referred", updated_at: new Date().toISOString() })
    .eq("id", inquiryId);

  // In-app notification
  try {
    const { createNotification } = await import("./notifications");
    await createNotification({
      creatorId,
      type: "inquiry_referral",
      title: `New job lead from ${inquiry.business_name}`,
      body: inquiry.project_description?.substring(0, 100),
      link: "/profile/edit",
    });
  } catch { /* silent */ }

  // Send email to creator if they have an account
  if (creator.auth_id) {
    try {
      const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(creator.auth_id);
      if (authUser?.user?.email) {
        const { sendJobReferralEmail } = await import("@/lib/email");
        await sendJobReferralEmail(
          authUser.user.email,
          creator.first_name || "Creator",
          inquiry.business_name,
          inquiry.project_description,
          note
        );
      }
    } catch {
      // Email is non-blocking
    }
  }

  revalidatePath("/admin/inquiries");
  return { success: true };
}

// Get job leads for a specific creator (for their profile)
export async function getMyJobLeads() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return [];

  const { data } = await getSupabaseAdmin()
    .from("inquiry_referrals")
    .select(`
      id, note, status, created_at,
      business_inquiries:inquiry_id(
        id, business_name, contact_name, email, project_description,
        budget_range, timeline, creator_types
      )
    `)
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  return data || [];
}

// Search creators for referral (admin use)
export async function searchCreatorsForReferral(query: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return [];

  // Sanitize: only allow alphanumeric, spaces, hyphens
  const sanitized = query.replace(/[^a-zA-Z0-9\s\-]/g, "").trim().substring(0, 50);
  if (!sanitized) return [];

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, skills, avatar_url, slug")
    .or(`first_name.ilike.%${sanitized}%,last_name.ilike.%${sanitized}%,skills.ilike.%${sanitized}%`)
    .limit(10);

  return data || [];
}

// Can't export non-async values from "use server" files
// Use getAdminEmails() instead
export async function getAdminEmails() {
  return ADMIN_EMAILS;
}
