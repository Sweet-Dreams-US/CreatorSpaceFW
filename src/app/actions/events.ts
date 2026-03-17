"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

interface EventData {
  title: string;
  description?: string;
  date: string;
  location?: string;
  image_url?: string;
  max_capacity?: number;
}

export async function createEvent(data: EventData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  const { error, data: event } = await supabaseAdmin
    .from("events")
    .insert({
      title: data.title,
      description: data.description || null,
      date: data.date,
      location: data.location || null,
      image_url: data.image_url || null,
      max_capacity: data.max_capacity || null,
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

  const { error } = await supabaseAdmin
    .from("events")
    .update({
      title: data.title,
      description: data.description || null,
      date: data.date,
      location: data.location || null,
      image_url: data.image_url || null,
      max_capacity: data.max_capacity || null,
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

  const { error } = await supabaseAdmin
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
  const { data } = await supabaseAdmin
    .from("events")
    .select("*")
    .gte("date", new Date().toISOString())
    .order("date", { ascending: true })
    .limit(1)
    .single();

  return data;
}

export async function getAllEvents() {
  const { data } = await supabaseAdmin
    .from("events")
    .select("*")
    .order("date", { ascending: false });

  return data || [];
}

export async function getEventRsvpCount(eventId: string) {
  const { count } = await supabaseAdmin
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  return count || 0;
}

export async function getEventAttendees(eventId: string) {
  const { data } = await supabaseAdmin
    .from("rsvps")
    .select("user_id, created_at")
    .eq("event_id", eventId);

  if (!data || data.length === 0) return [];

  const userIds = data.map((r) => r.user_id);
  const { data: creators } = await supabaseAdmin
    .from("creators")
    .select("id, first_name, last_name, email, avatar_url, auth_id")
    .in("auth_id", userIds);

  return creators || [];
}
