"use server";

import { supabaseAdmin } from "@/lib/supabase-server";

export async function rsvpToEvent(userId: string, eventId: string) {
  // Check if already RSVP'd
  const { data: existing } = await supabaseAdmin
    .from("rsvps")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .limit(1);

  if (existing && existing.length > 0) {
    return { success: true, alreadyRsvpd: true };
  }

  const { error } = await supabaseAdmin.from("rsvps").insert({
    user_id: userId,
    event_id: eventId,
  });

  if (error) {
    console.error("RSVP error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, alreadyRsvpd: false };
}

export async function checkRsvp(userId: string, eventId: string) {
  const { data } = await supabaseAdmin
    .from("rsvps")
    .select("id")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .limit(1);

  return { hasRsvpd: !!(data && data.length > 0) };
}
