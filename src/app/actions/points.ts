"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

const POINTS_MAP: Record<string, number> = {
  profile_view_received: 1,
  rsvp: 5,
  collab_post: 3,
  collab_response: 2,
  resource_listed: 3,
  connection_made: 2,
  challenge_submission: 3,
  profile_completeness: 1, // awarded per field filled
};

export async function awardPoints(
  creatorId: string,
  actionType: string,
  referenceId?: string
) {
  try {
    const points = POINTS_MAP[actionType] || 1;
    await getSupabaseAdmin().from("creator_points").insert({
      creator_id: creatorId,
      action_type: actionType,
      points,
      reference_id: referenceId || null,
    });
  } catch {
    // Silent fail like tracking — never block the main action
  }
}

export async function getCreatorPoints(creatorId: string) {
  const { data } = await getSupabaseAdmin()
    .from("creator_points")
    .select("points")
    .eq("creator_id", creatorId);

  return (data || []).reduce((sum, row) => sum + row.points, 0);
}

export async function getLeaderboard(month?: number, year?: number) {
  const admin = getSupabaseAdmin();

  let query = admin.from("creator_points").select("creator_id, points, created_at");

  if (month && year) {
    const start = new Date(year, month - 1, 1).toISOString();
    const end = new Date(year, month, 1).toISOString();
    query = query.gte("created_at", start).lt("created_at", end);
  }

  const { data: pointsData } = await query;
  if (!pointsData || pointsData.length === 0) return [];

  // Aggregate by creator
  const totals: Record<string, number> = {};
  for (const row of pointsData) {
    totals[row.creator_id] = (totals[row.creator_id] || 0) + row.points;
  }

  const creatorIds = Object.keys(totals);
  const { data: creators } = await admin
    .from("creators")
    .select("id, first_name, last_name, avatar_url, slug, skills")
    .in("id", creatorIds);

  return (creators || [])
    .map((c) => ({
      ...c,
      points: totals[c.id] || 0,
    }))
    .sort((a, b) => b.points - a.points);
}

export async function selectSpotlight(
  creatorId: string,
  month: number,
  year: number
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("spotlights")
    .upsert(
      { creator_id: creatorId, month, year, featured_at: new Date().toISOString() },
      { onConflict: "month,year" }
    );

  if (error) return { error: error.message };
  return { success: true };
}

export async function getCurrentSpotlight() {
  const now = new Date();
  const { data } = await getSupabaseAdmin()
    .from("spotlights")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug, bio, skills, company, job_title)")
    .eq("month", now.getMonth() + 1)
    .eq("year", now.getFullYear())
    .single();

  return data;
}

export async function getPastSpotlights() {
  const { data } = await getSupabaseAdmin()
    .from("spotlights")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .order("year", { ascending: false })
    .order("month", { ascending: false })
    .limit(12);

  return data || [];
}
