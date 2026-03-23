"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

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

export async function getAnalyticsOverview() {
  await requireAdmin();

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: viewsToday },
    { count: viewsWeek },
    { count: viewsMonth },
    { count: totalViews },
  ] = await Promise.all([
    getSupabaseAdmin()
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    getSupabaseAdmin()
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekAgo),
    getSupabaseAdmin()
      .from("page_views")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthAgo),
    getSupabaseAdmin()
      .from("page_views")
      .select("*", { count: "exact", head: true }),
  ]);

  // Unique visitors this week (distinct user_ids, excluding null)
  const { data: uniqueVisitorsData } = await getSupabaseAdmin()
    .from("page_views")
    .select("user_id")
    .gte("created_at", weekAgo)
    .not("user_id", "is", null);

  const uniqueVisitors = new Set(uniqueVisitorsData?.map((r) => r.user_id)).size;

  // Active users (page views in last 24 hours)
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: activeData } = await getSupabaseAdmin()
    .from("page_views")
    .select("user_id")
    .gte("created_at", dayAgo)
    .not("user_id", "is", null);

  const activeUsers = new Set(activeData?.map((r) => r.user_id)).size;

  // Top pages (last 30 days)
  const { data: pagesData } = await getSupabaseAdmin()
    .from("page_views")
    .select("path")
    .gte("created_at", monthAgo);

  const pageCounts: Record<string, number> = {};
  pagesData?.forEach((row) => {
    pageCounts[row.path] = (pageCounts[row.path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([path, count]) => ({ path, count }));

  return {
    viewsToday: viewsToday || 0,
    viewsWeek: viewsWeek || 0,
    viewsMonth: viewsMonth || 0,
    totalViews: totalViews || 0,
    uniqueVisitors,
    activeUsers,
    topPages,
  };
}

export async function getTrafficData(days: number = 14) {
  await requireAdmin();

  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  const { data } = await getSupabaseAdmin()
    .from("page_views")
    .select("created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true });

  // Group by date
  const dailyCounts: Record<string, number> = {};

  // Initialize all days with 0
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = d.toISOString().split("T")[0];
    dailyCounts[key] = 0;
  }

  data?.forEach((row) => {
    const key = new Date(row.created_at).toISOString().split("T")[0];
    if (dailyCounts[key] !== undefined) {
      dailyCounts[key]++;
    }
  });

  return Object.entries(dailyCounts).map(([date, count]) => ({
    date,
    count,
    label: new Date(date + "T12:00:00").toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
  }));
}

export async function getTopProfiles(limit: number = 10) {
  await requireAdmin();

  const { data } = await getSupabaseAdmin()
    .from("profile_views")
    .select("creator_id");

  if (!data || data.length === 0) return [];

  const profileCounts: Record<string, number> = {};
  data.forEach((row) => {
    profileCounts[row.creator_id] = (profileCounts[row.creator_id] || 0) + 1;
  });

  const topIds = Object.entries(profileCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  const creatorIds = topIds.map(([id]) => id);
  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, slug")
    .in("id", creatorIds);

  const creatorMap = new Map(creators?.map((c) => [c.id, c]));

  return topIds.map(([id, count]) => {
    const creator = creatorMap.get(id);
    return {
      creatorId: id,
      count,
      name: creator ? `${creator.first_name} ${creator.last_name}` : "Unknown",
      slug: creator?.slug || "",
    };
  });
}

export async function getRecentErrors(limit: number = 20) {
  await requireAdmin();

  const { data } = await getSupabaseAdmin()
    .from("error_reports")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

export async function getConnectionActivity(limit: number = 20) {
  await requireAdmin();

  const { data } = await getSupabaseAdmin()
    .from("connections")
    .select("id, from_creator_id, to_creator_id, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!data || data.length === 0) return [];

  // Get all unique creator IDs
  const creatorIds = [
    ...new Set(data.flatMap((c) => [c.from_creator_id, c.to_creator_id])),
  ];

  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name")
    .in("id", creatorIds);

  const creatorMap = new Map(
    creators?.map((c) => [c.id, `${c.first_name} ${c.last_name}`])
  );

  return data.map((conn) => ({
    id: conn.id,
    from: creatorMap.get(conn.from_creator_id) || "Unknown",
    to: creatorMap.get(conn.to_creator_id) || "Unknown",
    message: conn.message,
    status: conn.status,
    createdAt: conn.created_at,
  }));
}

export async function getRecentSignups(limit: number = 10) {
  await requireAdmin();

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, email, avatar_url, slug, created_at")
    .eq("claimed", true)
    .order("updated_at", { ascending: false })
    .limit(limit);

  return data || [];
}
