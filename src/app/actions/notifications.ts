"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";

export async function createNotification(data: {
  creatorId: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await getSupabaseAdmin().from("notifications").insert({
      creator_id: data.creatorId,
      type: data.type,
      title: data.title,
      body: data.body || null,
      link: data.link || null,
    });
  } catch {
    // Non-blocking
  }
}

export async function getMyNotifications() {
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
    .from("notifications")
    .select("*")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return data || [];
}

export async function getUnreadCount() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return 0;

  const { count } = await getSupabaseAdmin()
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("creator_id", creator.id)
    .eq("read", false);

  return count || 0;
}

export async function markAsRead(notificationId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await getSupabaseAdmin()
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
}

export async function markAllAsRead() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return;

  await getSupabaseAdmin()
    .from("notifications")
    .update({ read: true })
    .eq("creator_id", creator.id)
    .eq("read", false);
}
