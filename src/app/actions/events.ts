"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

interface EventData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  image_url?: string;
  max_capacity?: number;
  facebook_url?: string;
}

export async function createEvent(data: EventData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  const { error, data: event } = await getSupabaseAdmin()
    .from("events")
    .insert({
      title: data.title,
      description: data.description || null,
      date: data.date,
      location: data.location || null,
      image_url: data.image_url || null,
      max_capacity: data.max_capacity || null,
      facebook_url: data.facebook_url || null,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { error: "Failed to create event." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true, id: event.id };
}

export async function updateEvent(eventId: string, data: EventData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  const { error } = await getSupabaseAdmin()
    .from("events")
    .update({
      title: data.title,
      description: data.description || null,
      date: data.date,
      location: data.location || null,
      image_url: data.image_url || null,
      max_capacity: data.max_capacity || null,
      facebook_url: data.facebook_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", eventId);

  if (error) {
    return { error: "Failed to update event." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true };
}

export async function deleteEvent(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  const { error } = await getSupabaseAdmin()
    .from("events")
    .delete()
    .eq("id", eventId);

  if (error) {
    return { error: "Failed to delete event." };
  }

  revalidatePath("/admin/events");
  revalidatePath("/");
  return { success: true };
}

export async function getNextEvent() {
  const { data } = await getSupabaseAdmin()
    .from("events")
    .select("*")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(1)
    .single();

  return data;
}

export async function getAllEvents() {
  const { data } = await getSupabaseAdmin()
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  return data || [];
}

export async function getEventRsvpCount(eventId: string) {
  const { count } = await getSupabaseAdmin()
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  return count || 0;
}

export async function getEventConfirmedCount(eventId: string) {
  const { count } = await getSupabaseAdmin()
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ["confirmed", "checked_in"]);

  return count || 0;
}

export async function getEventCheckInStats(eventId: string) {
  const supabase = getSupabaseAdmin();

  const statuses = ["confirmed", "waitlisted", "checked_in", "no_show"] as const;
  const results: Record<string, number> = {};

  for (const status of statuses) {
    const { count } = await supabase
      .from("rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", status);
    results[status] = count ?? 0;
  }

  return results as {
    confirmed: number;
    waitlisted: number;
    checked_in: number;
    no_show: number;
  };
}

export async function getEventAttendees(eventId: string) {
  const { data } = await getSupabaseAdmin()
    .from("rsvps")
    .select("user_id, created_at, status, checked_in_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: true });

  if (!data || data.length === 0) return [];

  const userIds = data.map((r) => r.user_id);
  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, email, avatar_url, auth_id, slug")
    .in("auth_id", userIds);

  // Merge RSVP status onto creator records
  return (creators || []).map((creator) => {
    const rsvp = data.find((r) => r.user_id === creator.auth_id);
    return {
      ...creator,
      rsvp_status: rsvp?.status ?? "confirmed",
      checked_in_at: rsvp?.checked_in_at ?? null,
      rsvp_created_at: rsvp?.created_at ?? null,
    };
  });
}
