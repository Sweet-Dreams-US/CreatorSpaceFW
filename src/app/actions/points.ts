"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { sendSpotlightEmail } from "@/lib/email";

const POINTS_MAP: Record<string, number> = {
  profile_view_received: 1,
  rsvp: 5,
  collab_post: 3,
  collab_response: 2,
  resource_listed: 3,
  connection_made: 2,
  challenge_submission: 3,
  profile_completeness: 1, // awarded per field filled
  invite_sent: 2,
  invite_claimed: 5, // bonus when invite leads to signup
};

export async function awardPoints(
  creatorId: string,
  actionType: string,
  referenceId?: string
) {
  try {
    // Only award points to claimed creators
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select("claimed")
      .eq("id", creatorId)
      .single();
    if (!creator?.claimed) return;

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

  // Send spotlight announcement emails to all claimed creators
  try {
    const { data: spotlightCreator } = await getSupabaseAdmin()
      .from("creators")
      .select("first_name, last_name, slug")
      .eq("id", creatorId)
      .single();

    if (spotlightCreator?.slug) {
      const spotlightName = `${spotlightCreator.first_name} ${spotlightCreator.last_name}`;

      // Get all claimed creators with email
      const { data: claimedCreators } = await getSupabaseAdmin()
        .from("creators")
        .select("first_name, auth_id")
        .not("auth_id", "is", null);

      if (claimedCreators && claimedCreators.length > 0) {
        // Fetch emails from auth users
        const authIds = claimedCreators.map((c: { auth_id: string }) => c.auth_id);
        const emailResults = await Promise.allSettled(
          authIds.map(async (authId: string) => {
            const { data } = await getSupabaseAdmin().auth.admin.getUserById(authId);
            return data?.user?.email;
          })
        );

        const emailSends: Promise<unknown>[] = [];
        for (let i = 0; i < claimedCreators.length; i++) {
          const emailResult = emailResults[i];
          const email =
            emailResult.status === "fulfilled" ? emailResult.value : null;
          if (email) {
            emailSends.push(
              sendSpotlightEmail(
                email,
                claimedCreators[i].first_name || "Creator",
                spotlightName,
                spotlightCreator.slug
              )
            );
          }
        }

        // Fire-and-forget — don't block the response
        await Promise.allSettled(emailSends);
      }
    }
  } catch {
    // Email sending is non-blocking — never fail the spotlight selection
  }

  return { success: true };
}

// Points breakdown for a creator — grouped by action type
export async function getPointsBreakdown(creatorId: string) {
  const { data } = await getSupabaseAdmin()
    .from("creator_points")
    .select("action_type, points, created_at")
    .eq("creator_id", creatorId)
    .order("created_at", { ascending: false });

  if (!data || data.length === 0) return { total: 0, byAction: {}, recent: [] };

  const byAction: Record<string, { count: number; total: number }> = {};
  let total = 0;

  for (const row of data) {
    total += row.points;
    if (!byAction[row.action_type]) {
      byAction[row.action_type] = { count: 0, total: 0 };
    }
    byAction[row.action_type].count++;
    byAction[row.action_type].total += row.points;
  }

  return {
    total,
    byAction,
    recent: data.slice(0, 20), // last 20 point events
  };
}

// POINTS_MAP exposed for the earning guide
export async function getPointsGuide() {
  return Object.entries(POINTS_MAP).map(([action, points]) => ({
    action,
    points,
    label: ACTION_LABELS[action] || action,
  }));
}

const ACTION_LABELS: Record<string, string> = {
  profile_view_received: "Someone views your profile",
  rsvp: "RSVP to an event",
  collab_post: "Post a collaboration request",
  collab_response: "Respond to a collab post",
  resource_listed: "List a resource",
  connection_made: "Connect with a creator",
  challenge_submission: "Submit to a challenge",
  profile_completeness: "Complete a profile field",
  invite_sent: "Invite a friend",
  invite_claimed: "Friend signs up from your invite",
};

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
