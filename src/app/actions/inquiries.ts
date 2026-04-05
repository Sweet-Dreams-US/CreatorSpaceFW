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

export { ADMIN_EMAILS };
