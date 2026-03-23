"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { generateUniqueSlug } from "@/lib/utils";

async function requireAdmin() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    throw new Error("Not authorized");
  }

  return user;
}

export async function adminDeleteCreator(creatorId: string) {
  await requireAdmin();

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .delete()
    .eq("id", creatorId);

  if (error) return { error: "Failed to delete creator." };

  revalidatePath("/admin/creators");
  revalidatePath("/directory");
  return { success: true };
}

export async function adminDeleteCreators(creatorIds: string[]) {
  await requireAdmin();

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .delete()
    .in("id", creatorIds);

  if (error) return { error: "Failed to delete creators." };

  revalidatePath("/admin/creators");
  revalidatePath("/directory");
  return { success: true, deleted: creatorIds.length };
}

export async function adminAddCreator(data: {
  first_name: string;
  last_name: string;
  email?: string;
  company?: string;
  job_title?: string;
  skills?: string;
  social?: string;
}) {
  await requireAdmin();

  const slug = await generateUniqueSlug(data.first_name, data.last_name || "");

  const { error } = await getSupabaseAdmin().from("creators").insert({
    first_name: data.first_name,
    last_name: data.last_name || null,
    email: data.email || null,
    company: data.company || null,
    job_title: data.job_title || null,
    skills: data.skills || "",
    social: data.social || null,
    slug,
    claimed: false,
  });

  if (error) return { error: "Failed to add creator." };

  revalidatePath("/admin/creators");
  revalidatePath("/directory");
  return { success: true };
}

export async function adminUpdateCreator(
  creatorId: string,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    company?: string;
    job_title?: string;
    skills?: string;
    social?: string;
    website?: string;
    bio?: string;
  }
) {
  await requireAdmin();

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId);

  if (error) return { error: "Failed to update creator." };

  revalidatePath("/admin/creators");
  revalidatePath("/directory");
  return { success: true };
}

export async function getAllCreatorsAdmin() {
  const { data, error } = await getSupabaseAdmin()
    .from("creators")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data || [];
}

export async function getAdminStats() {
  const { count: totalCreators } = await getSupabaseAdmin()
    .from("creators")
    .select("*", { count: "exact", head: true });

  const { count: claimedCreators } = await getSupabaseAdmin()
    .from("creators")
    .select("*", { count: "exact", head: true })
    .eq("claimed", true);

  const { count: invitesSent } = await getSupabaseAdmin()
    .from("creators")
    .select("*", { count: "exact", head: true })
    .not("invite_sent_at", "is", null);

  const { count: totalEvents } = await getSupabaseAdmin()
    .from("events")
    .select("*", { count: "exact", head: true });

  const { count: totalRsvps } = await getSupabaseAdmin()
    .from("rsvps")
    .select("*", { count: "exact", head: true });

  // Recent signups (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { data: recentSignups } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, email, avatar_url, claimed, created_at")
    .eq("claimed", true)
    .gte("updated_at", weekAgo.toISOString())
    .order("updated_at", { ascending: false })
    .limit(10);

  return {
    totalCreators: totalCreators || 0,
    claimedCreators: claimedCreators || 0,
    unclaimedCreators: (totalCreators || 0) - (claimedCreators || 0),
    invitesSent: invitesSent || 0,
    totalEvents: totalEvents || 0,
    totalRsvps: totalRsvps || 0,
    recentSignups: recentSignups || [],
  };
}

export async function exportCreatorsCSV() {
  await requireAdmin();

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("first_name, last_name, email, company, job_title, skills, social, website, claimed, created_at")
    .order("last_name", { ascending: true });

  if (!data) return { error: "Failed to export." };

  const headers = ["First Name", "Last Name", "Email", "Company", "Job Title", "Skills", "Social", "Website", "Claimed", "Created"];
  const rows = data.map((c) => [
    c.first_name || "",
    c.last_name || "",
    c.email || "",
    c.company || "",
    c.job_title || "",
    c.skills || "",
    c.social || "",
    c.website || "",
    c.claimed ? "Yes" : "No",
    c.created_at || "",
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  return { success: true, csv };
}
