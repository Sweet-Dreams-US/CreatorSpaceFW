"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

const FEATURE_OPTIONS = [
  "Directory",
  "Collaborate",
  "Challenges",
  "Skills Exchange",
  "Events",
  "Profile",
  "Hire a Creator",
  "Spotlight",
  "Navigation",
  "Mobile Experience",
  "Other",
];

export async function getFeatureOptions() {
  return FEATURE_OPTIONS;
}

export async function submitFeedback(data: {
  type: "bug" | "feature_request" | "improvement" | "general";
  feature?: string;
  subject: string;
  body: string;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  const { error } = await getSupabaseAdmin().from("feedback").insert({
    creator_id: creator?.id || null,
    type: data.type,
    feature: data.feature || null,
    subject: data.subject,
    body: data.body,
  });

  if (error) return { error: error.message };
  return { success: true };
}

export async function getMyFeedback() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return [];

  const { data } = await getSupabaseAdmin()
    .from("feedback")
    .select("*")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getAllFeedback() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return [];

  const { data } = await getSupabaseAdmin()
    .from("feedback")
    .select("*, creators:creator_id(first_name, last_name, slug)")
    .order("created_at", { ascending: false });

  return data || [];
}

export async function updateFeedbackStatus(feedbackId: string, status: string, adminResponse?: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const update: Record<string, string> = { status };
  if (adminResponse !== undefined) update.admin_response = adminResponse;

  const { error } = await getSupabaseAdmin()
    .from("feedback")
    .update(update)
    .eq("id", feedbackId);

  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { success: true };
}
