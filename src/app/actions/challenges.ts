"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { awardPoints } from "./points";

interface ChallengeData {
  title: string;
  description?: string;
  month: number;
  year: number;
  submission_deadline?: string;
}

export async function createChallenge(data: ChallengeData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin().from("challenges").insert({
    title: data.title,
    description: data.description || null,
    month: data.month,
    year: data.year,
    submission_deadline: data.submission_deadline || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/challenges");
  return { success: true };
}

export async function updateChallenge(challengeId: string, data: Partial<ChallengeData>) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("challenges")
    .update(data)
    .eq("id", challengeId);

  if (error) return { error: error.message };
  revalidatePath("/challenges");
  return { success: true };
}

export async function closeChallenge(challengeId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("challenges")
    .update({ status: "past" })
    .eq("id", challengeId);

  if (error) return { error: error.message };
  revalidatePath("/challenges");
  return { success: true };
}

export async function getCurrentChallenge() {
  const { data } = await getSupabaseAdmin()
    .from("challenges")
    .select("*")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return data;
}

export async function getPastChallenges() {
  const { data } = await getSupabaseAdmin()
    .from("challenges")
    .select("*")
    .eq("status", "past")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return data || [];
}

export async function getChallengeWithSubmissions(challengeId: string) {
  const { data: challenge } = await getSupabaseAdmin()
    .from("challenges")
    .select("*")
    .eq("id", challengeId)
    .single();

  if (!challenge) return null;

  const { data: submissions } = await getSupabaseAdmin()
    .from("challenge_submissions")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("challenge_id", challengeId)
    .order("created_at", { ascending: false });

  return { ...challenge, submissions: submissions || [] };
}

export async function submitToChallenge(
  challengeId: string,
  data: { title: string; description?: string; media_url?: string; link_url?: string }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return { error: "Creator profile not found" };

  const { error } = await getSupabaseAdmin().from("challenge_submissions").insert({
    challenge_id: challengeId,
    creator_id: creator.id,
    title: data.title,
    description: data.description || null,
    media_url: data.media_url || null,
    link_url: data.link_url || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already submitted" };
    return { error: error.message };
  }

  await awardPoints(creator.id, "challenge_submission");
  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function getAllChallenges() {
  const { data } = await getSupabaseAdmin()
    .from("challenges")
    .select("*")
    .order("year", { ascending: false })
    .order("month", { ascending: false });

  return data || [];
}

export async function getSubmissionCount(challengeId: string) {
  const { count } = await getSupabaseAdmin()
    .from("challenge_submissions")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  return count || 0;
}
