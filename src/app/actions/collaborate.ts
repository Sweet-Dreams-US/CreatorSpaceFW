"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { awardPoints } from "./points";

interface CollabPostData {
  type: "looking_for" | "offering";
  title: string;
  description?: string;
  category?: string;
  budget?: string;
  deadline?: string;
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
  });

  if (error) return { error: error.message };
  await awardPoints(creator.id, "collab_post");
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
