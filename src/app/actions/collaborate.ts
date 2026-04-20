"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { createNotification } from "./notifications";
import { awardPoints } from "./points";

interface CollabPostData {
  type: "looking_for" | "offering";
  title: string;
  description?: string;
  category?: string;
  budget?: string;
  deadline?: string;
  team_size?: number;
  positions?: string;
  scope?: string;
}

export async function createCollabPost(data: CollabPostData) {
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

  const { error } = await getSupabaseAdmin().from("collab_posts").insert({
    creator_id: creator.id,
    type: data.type,
    title: data.title,
    description: data.description || null,
    category: data.category || null,
    budget: data.budget || null,
    deadline: data.deadline || null,
    team_size: data.team_size || null,
    positions: data.positions || null,
    scope: data.scope || null,
  });

  if (error) return { error: error.message };
  await awardPoints(creator.id, "collab_post");

  // Check challenge auto-requirements
  try {
    const { checkAutoRequirements } = await import("./challenges");
    await checkAutoRequirements(creator.id);
  } catch { /* non-blocking */ }

  revalidatePath("/collaborate");
  return { success: true };
}

export async function getCollabPosts(filters?: {
  type?: string;
  category?: string;
  status?: string;
}) {
  let query = getSupabaseAdmin()
    .from("collab_posts")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("hidden", false)
    .order("created_at", { ascending: false });

  if (filters?.type) query = query.eq("type", filters.type);
  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.status && filters.status !== "all") query = query.eq("status", filters.status);
  else if (!filters?.status) query = query.eq("status", "open");

  const { data } = await query;
  return data || [];
}

export async function getMyCollabPosts() {
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
    .from("collab_posts")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  return data || [];
}

export async function getCollabPost(postId: string) {
  const { data: post } = await getSupabaseAdmin()
    .from("collab_posts")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("id", postId)
    .single();

  if (!post) return null;

  const { data: responses } = await getSupabaseAdmin()
    .from("collab_responses")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  // Ensure status field is present (default 'pending' for old rows)
  const responsesWithStatus = (responses || []).map((r: Record<string, unknown>) => ({
    ...r,
    status: r.status || "pending",
  }));

  return { ...post, responses: responsesWithStatus };
}

export async function respondToCollabPost(postId: string, message: string) {
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

  const { error } = await getSupabaseAdmin().from("collab_responses").insert({
    post_id: postId,
    creator_id: creator.id,
    message: message || null,
  });

  if (error) {
    if (error.code === "23505") return { error: "Already responded" };
    return { error: error.message };
  }

  await awardPoints(creator.id, "collab_response");

  // Check challenge auto-requirements
  try {
    const { checkAutoRequirements } = await import("./challenges");
    await checkAutoRequirements(creator.id);
  } catch { /* non-blocking */ }

  // In-app notification to post author
  try {
    const { data: postInfo } = await getSupabaseAdmin()
      .from("collab_posts")
      .select("title, creator_id")
      .eq("id", postId)
      .single();
    const { data: responderInfo } = await getSupabaseAdmin()
      .from("creators")
      .select("first_name, last_name")
      .eq("id", creator.id)
      .single();
    if (postInfo && responderInfo) {
      await createNotification({
        creatorId: postInfo.creator_id,
        type: "collab_response",
        title: `${responderInfo.first_name} ${responderInfo.last_name} is interested in "${postInfo.title}"`,
        link: `/collaborate/${postId}`,
      });
    }
  } catch { /* silent */ }

  // Email notification to post author
  try {
    const { data: post } = await getSupabaseAdmin()
      .from("collab_posts")
      .select("title, creator_id")
      .eq("id", postId)
      .single();
    if (post) {
      const { data: postAuthor } = await getSupabaseAdmin()
        .from("creators")
        .select("first_name, auth_id")
        .eq("id", post.creator_id)
        .single();
      const { data: responder } = await getSupabaseAdmin()
        .from("creators")
        .select("first_name, last_name")
        .eq("id", creator.id)
        .single();
      if (postAuthor?.auth_id && responder) {
        const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(postAuthor.auth_id);
        if (authUser?.user?.email) {
          const { sendCollabResponseNotification } = await import("@/lib/email");
          await sendCollabResponseNotification(
            authUser.user.email,
            postAuthor.first_name || "Creator",
            `${responder.first_name} ${responder.last_name}`,
            post.title,
            postId
          );
        }
      }
    }
  } catch {
    // Email is non-blocking
  }

  revalidatePath(`/collaborate/${postId}`);
  return { success: true };
}

export async function updateCollabPostStatus(postId: string, status: string) {
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
    .from("collab_posts")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", postId)
    .eq("creator_id", creator.id);

  if (error) return { error: error.message };
  revalidatePath("/collaborate");
  return { success: true };
}

export async function deleteCollabPost(postId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  // Allow owner or admin
  const admin = isAdmin(user.email);
  if (!admin) {
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select("id")
      .eq("auth_id", user.id)
      .single();

    const { data: post } = await getSupabaseAdmin()
      .from("collab_posts")
      .select("creator_id")
      .eq("id", postId)
      .single();

    if (!post || post.creator_id !== creator?.id) return { error: "Not authorized" };
  }

  await getSupabaseAdmin().from("collab_posts").delete().eq("id", postId);
  revalidatePath("/collaborate");
  return { success: true };
}

export async function respondToCollabResponse(
  responseId: string,
  status: "accepted" | "declined"
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

  // Verify the current user owns the post this response belongs to
  const { data: response } = await getSupabaseAdmin()
    .from("collab_responses")
    .select("id, post_id")
    .eq("id", responseId)
    .single();
  if (!response) return { error: "Response not found" };

  const { data: post } = await getSupabaseAdmin()
    .from("collab_posts")
    .select("creator_id")
    .eq("id", response.post_id)
    .single();
  if (!post || post.creator_id !== creator.id) return { error: "Not authorized" };

  const { error } = await getSupabaseAdmin()
    .from("collab_responses")
    .update({ status })
    .eq("id", responseId);

  if (error) return { error: error.message };

  // In-app notification to responder
  try {
    const { data: responseInfo } = await getSupabaseAdmin()
      .from("collab_responses")
      .select("creator_id")
      .eq("id", responseId)
      .single();
    const { data: postInfo } = await getSupabaseAdmin()
      .from("collab_posts")
      .select("title")
      .eq("id", response.post_id)
      .single();
    if (responseInfo && postInfo) {
      await createNotification({
        creatorId: responseInfo.creator_id,
        type: status === "accepted" ? "collab_accepted" : "collab_declined",
        title: status === "accepted"
          ? `You've been accepted for "${postInfo.title}"!`
          : `Update on your request for "${postInfo.title}"`,
        link: `/collaborate/${response.post_id}`,
      });
    }
  } catch { /* silent */ }

  // Email notification to responder about the decision
  try {
    const { data: responseData } = await getSupabaseAdmin()
      .from("collab_responses")
      .select("creator_id")
      .eq("id", responseId)
      .single();
    const { data: postData } = await getSupabaseAdmin()
      .from("collab_posts")
      .select("title")
      .eq("id", response.post_id)
      .single();
    if (responseData && postData) {
      const { data: responderCreator } = await getSupabaseAdmin()
        .from("creators")
        .select("first_name, auth_id")
        .eq("id", responseData.creator_id)
        .single();
      if (responderCreator?.auth_id) {
        const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(responderCreator.auth_id);
        if (authUser?.user?.email) {
          const { sendCollabDecisionNotification } = await import("@/lib/email");
          await sendCollabDecisionNotification(
            authUser.user.email,
            responderCreator.first_name || "Creator",
            postData.title,
            status as "accepted" | "declined",
            response.post_id
          );
        }
      }
    }
  } catch {
    // Email is non-blocking
  }

  revalidatePath(`/collaborate/${response.post_id}`);
  return { success: true };
}

export async function getResponseCount(postId: string) {
  const { count } = await getSupabaseAdmin()
    .from("collab_responses")
    .select("*", { count: "exact", head: true })
    .eq("post_id", postId);
  return count || 0;
}

export async function hideCollabPost(postId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  await getSupabaseAdmin().from("collab_posts").update({ hidden: true }).eq("id", postId);
  revalidatePath("/collaborate");
  return { success: true };
}

export async function unhideCollabPost(postId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user.email)) return { error: "Not authorized" };

  await getSupabaseAdmin().from("collab_posts").update({ hidden: false }).eq("id", postId);
  revalidatePath("/collaborate");
  return { success: true };
}

export async function getResponseCountsBatch(postIds: string[]) {
  if (postIds.length === 0) return {};
  const { data } = await getSupabaseAdmin()
    .from("collab_responses")
    .select("post_id")
    .in("post_id", postIds);

  const counts: Record<string, number> = {};
  for (const id of postIds) counts[id] = 0;
  for (const row of data || []) {
    counts[row.post_id] = (counts[row.post_id] || 0) + 1;
  }
  return counts;
}
