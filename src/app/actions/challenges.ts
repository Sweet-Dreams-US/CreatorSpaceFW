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
  starts_at?: string;
  ends_at?: string;
  rules?: string;
  hashtag?: string;
  instagram_handle?: string;
  show_hashtag?: boolean;
  show_instagram?: boolean;
  requirements?: { title: string; description?: string; points: number; auto_type?: string; auto_threshold?: number }[];
}

export async function createChallenge(data: ChallengeData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  const { error, data: newChallenge } = await getSupabaseAdmin().from("challenges").insert({
    title: data.title,
    description: data.description || null,
    month: data.month,
    year: data.year,
    submission_deadline: data.submission_deadline || null,
    starts_at: data.starts_at || null,
    ends_at: data.ends_at || null,
    rules: data.rules || null,
    hashtag: data.hashtag || null,
    instagram_handle: data.instagram_handle || null,
    show_hashtag: data.show_hashtag ?? true,
    show_instagram: data.show_instagram ?? true,
    created_by: user.id,
  }).select("id").single();

  if (error) return { error: error.message };

  // Insert requirements if provided
  if (data.requirements && data.requirements.length > 0 && newChallenge?.id) {
    const reqs = data.requirements.map((r, i) => ({
      challenge_id: newChallenge.id,
      title: r.title,
      description: r.description || null,
      points: r.points || 1,
      sort_order: i,
      auto_type: r.auto_type || null,
      auto_threshold: r.auto_threshold || 1,
    }));
    await getSupabaseAdmin().from("challenge_requirements").insert(reqs);
  }

  // Notify all claimed creators about the new challenge
  try {
    const { createNotification } = await import("./notifications");
    const { data: claimedCreators } = await getSupabaseAdmin()
      .from("creators")
      .select("id, first_name, auth_id")
      .not("auth_id", "is", null)
      .eq("claimed", true);

    if (claimedCreators) {
      // In-app notifications
      for (const c of claimedCreators) {
        await createNotification({
          creatorId: c.id,
          type: "challenge",
          title: `New Challenge: ${data.title}`,
          body: data.description?.substring(0, 100),
          link: `/challenges`,
        });
      }

      // Email notifications (fire-and-forget)
      try {
        const { sendChallengeNotificationEmail } = await import("@/lib/email");
        const authIds = claimedCreators.filter((c) => c.auth_id).map((c) => c.auth_id!);
        const emailResults = await Promise.allSettled(
          authIds.map(async (authId) => {
            const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(authId);
            return authUser?.user?.email;
          })
        );
        const emails = emailResults
          .filter((r) => r.status === "fulfilled" && r.value)
          .map((r) => (r as PromiseFulfilledResult<string>).value);

        for (const email of emails) {
          await sendChallengeNotificationEmail(email, data.title, data.description || "");
        }
      } catch { /* email non-blocking */ }
    }
  } catch { /* notification non-blocking */ }

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

export async function acceptChallenge(challengeId: string) {
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

  const { error } = await getSupabaseAdmin()
    .from("challenge_acceptances")
    .insert({ challenge_id: challengeId, creator_id: creator.id });

  if (error) {
    if (error.code === "23505") return { success: true }; // Already accepted
    return { error: error.message };
  }

  // Auto-check requirements (including "challenge_accept" type)
  try {
    await checkAutoRequirements(creator.id);
  } catch { /* non-blocking */ }

  revalidatePath(`/challenges/${challengeId}`);
  return { success: true };
}

export async function hasAcceptedChallenge(challengeId: string, userId: string) {
  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", userId)
    .single();
  if (!creator) return false;

  const { data } = await getSupabaseAdmin()
    .from("challenge_acceptances")
    .select("id")
    .eq("challenge_id", challengeId)
    .eq("creator_id", creator.id)
    .single();

  return !!data;
}

export async function getAcceptanceCount(challengeId: string) {
  const { count } = await getSupabaseAdmin()
    .from("challenge_acceptances")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  return count || 0;
}

export async function getSubmissionCount(challengeId: string) {
  const { count } = await getSupabaseAdmin()
    .from("challenge_submissions")
    .select("*", { count: "exact", head: true })
    .eq("challenge_id", challengeId);
  return count || 0;
}

export async function hideSubmission(submissionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  await getSupabaseAdmin().from("challenge_submissions").update({ hidden: true }).eq("id", submissionId);
  return { success: true };
}

export async function deleteSubmission(submissionId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  await getSupabaseAdmin().from("challenge_submissions").delete().eq("id", submissionId);
  return { success: true };
}

export async function getSubmissionCountsBatch(challengeIds: string[]) {
  if (challengeIds.length === 0) return {};
  const { data } = await getSupabaseAdmin()
    .from("challenge_submissions")
    .select("challenge_id")
    .in("challenge_id", challengeIds);

  const counts: Record<string, number> = {};
  for (const id of challengeIds) counts[id] = 0;
  for (const row of data || []) {
    counts[row.challenge_id] = (counts[row.challenge_id] || 0) + 1;
  }
  return counts;
}

// --- Auto-tracking for challenge requirements ---

export async function checkAutoRequirements(creatorId: string) {
  // Get all active challenges
  const { data: activeChallenges } = await getSupabaseAdmin()
    .from("challenges")
    .select("id, starts_at, ends_at")
    .eq("status", "active");

  if (!activeChallenges || activeChallenges.length === 0) return;

  for (const challenge of activeChallenges) {
    // Get auto-tracked requirements for this challenge
    const { data: autoReqs } = await getSupabaseAdmin()
      .from("challenge_requirements")
      .select("id, auto_type, auto_threshold")
      .eq("challenge_id", challenge.id)
      .not("auto_type", "is", null);

    if (!autoReqs || autoReqs.length === 0) continue;

    // Check if user accepted this challenge
    const { data: acceptance } = await getSupabaseAdmin()
      .from("challenge_acceptances")
      .select("id")
      .eq("challenge_id", challenge.id)
      .eq("creator_id", creatorId)
      .single();

    if (!acceptance) continue;

    // Get already completed requirements
    const { data: completions } = await getSupabaseAdmin()
      .from("challenge_requirement_completions")
      .select("requirement_id")
      .eq("creator_id", creatorId)
      .in("requirement_id", autoReqs.map((r) => r.id));

    const completedSet = new Set((completions || []).map((c) => c.requirement_id));

    // Check each auto requirement
    for (const req of autoReqs) {
      if (completedSet.has(req.id)) continue; // Already done

      let met = false;
      const threshold = req.auto_threshold || 1;

      // Date range filter for challenge period
      const dateFilter: { gte?: string; lte?: string } = {};
      if (challenge.starts_at) dateFilter.gte = challenge.starts_at;
      if (challenge.ends_at) dateFilter.lte = challenge.ends_at;

      switch (req.auto_type) {
        case "collab_post": {
          let q = getSupabaseAdmin()
            .from("collab_posts")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creatorId);
          if (dateFilter.gte) q = q.gte("created_at", dateFilter.gte);
          if (dateFilter.lte) q = q.lte("created_at", dateFilter.lte);
          const { count } = await q;
          met = (count || 0) >= threshold;
          break;
        }
        case "collab_post_positions": {
          let q = getSupabaseAdmin()
            .from("collab_posts")
            .select("positions")
            .eq("creator_id", creatorId)
            .not("positions", "is", null);
          if (dateFilter.gte) q = q.gte("created_at", dateFilter.gte);
          if (dateFilter.lte) q = q.lte("created_at", dateFilter.lte);
          const { data: posts } = await q;
          const hasEnough = (posts || []).some((p) => {
            const count = p.positions?.split(",").filter(Boolean).length || 0;
            return count >= threshold;
          });
          met = hasEnough;
          break;
        }
        case "collab_post_scope": {
          let q = getSupabaseAdmin()
            .from("collab_posts")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creatorId)
            .not("scope", "is", null);
          if (dateFilter.gte) q = q.gte("created_at", dateFilter.gte);
          if (dateFilter.lte) q = q.lte("created_at", dateFilter.lte);
          const { count } = await q;
          met = (count || 0) >= 1;
          break;
        }
        case "collab_responses": {
          let q = getSupabaseAdmin()
            .from("collab_responses")
            .select("id", { count: "exact", head: true })
            .eq("creator_id", creatorId);
          if (dateFilter.gte) q = q.gte("created_at", dateFilter.gte);
          if (dateFilter.lte) q = q.lte("created_at", dateFilter.lte);
          const { count } = await q;
          met = (count || 0) >= threshold;
          break;
        }
        case "challenge_accept": {
          met = true; // Already checked above
          break;
        }
      }

      if (met) {
        // Auto-complete this requirement
        const { error } = await getSupabaseAdmin()
          .from("challenge_requirement_completions")
          .insert({ requirement_id: req.id, creator_id: creatorId });

        if (!error) {
          // Get points value
          const { data: reqData } = await getSupabaseAdmin()
            .from("challenge_requirements")
            .select("points")
            .eq("id", req.id)
            .single();
          if (reqData) {
            await awardPoints(creatorId, "challenge_requirement", req.id, reqData.points);
          }
        }
      }
    }
  }
}

// --- Challenge Requirements ---

export async function getChallengeRequirements(challengeId: string) {
  const { data } = await getSupabaseAdmin()
    .from("challenge_requirements")
    .select("*")
    .eq("challenge_id", challengeId)
    .order("sort_order", { ascending: true });
  return data || [];
}

export async function completeRequirement(requirementId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return { error: "Creator not found" };

  // Get the requirement to know points value
  const { data: req } = await getSupabaseAdmin()
    .from("challenge_requirements")
    .select("id, points, challenge_id")
    .eq("id", requirementId)
    .single();
  if (!req) return { error: "Requirement not found" };

  const { error } = await getSupabaseAdmin()
    .from("challenge_requirement_completions")
    .insert({ requirement_id: requirementId, creator_id: creator.id });

  if (error) {
    if (error.code === "23505") return { error: "Already completed" };
    return { error: error.message };
  }

  // Award points (use requirement's own value)
  await awardPoints(creator.id, "challenge_requirement", requirementId, req.points);

  revalidatePath(`/challenges/${req.challenge_id}`);
  return { success: true };
}

export async function getMyCompletions(challengeId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return [];

  const { data: reqs } = await getSupabaseAdmin()
    .from("challenge_requirements")
    .select("id")
    .eq("challenge_id", challengeId);

  if (!reqs || reqs.length === 0) return [];

  const { data } = await getSupabaseAdmin()
    .from("challenge_requirement_completions")
    .select("requirement_id")
    .eq("creator_id", creator.id)
    .in("requirement_id", reqs.map((r) => r.id));

  return (data || []).map((d) => d.requirement_id);
}

export async function getChallengeLeaderboard(challengeId: string) {
  // Get all requirements for this challenge
  const { data: reqs } = await getSupabaseAdmin()
    .from("challenge_requirements")
    .select("id, points")
    .eq("challenge_id", challengeId);

  if (!reqs || reqs.length === 0) return [];

  // Get all completions
  const { data: completions } = await getSupabaseAdmin()
    .from("challenge_requirement_completions")
    .select("requirement_id, creator_id")
    .in("requirement_id", reqs.map((r) => r.id));

  if (!completions || completions.length === 0) return [];

  // Build points map
  const reqPoints: Record<string, number> = {};
  for (const r of reqs) reqPoints[r.id] = r.points;

  const creatorPoints: Record<string, number> = {};
  const creatorCompleted: Record<string, number> = {};
  for (const c of completions) {
    creatorPoints[c.creator_id] = (creatorPoints[c.creator_id] || 0) + (reqPoints[c.requirement_id] || 0);
    creatorCompleted[c.creator_id] = (creatorCompleted[c.creator_id] || 0) + 1;
  }

  const creatorIds = Object.keys(creatorPoints);
  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, avatar_url, slug")
    .in("id", creatorIds);

  return (creators || []).map((c) => ({
    ...c,
    points: creatorPoints[c.id] || 0,
    completed: creatorCompleted[c.id] || 0,
    total: reqs.length,
  })).sort((a, b) => b.points - a.points);
}
