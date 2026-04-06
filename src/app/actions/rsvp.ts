"use server";

import { getSupabaseAdmin } from "@/lib/supabase-server";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export async function rsvpToEvent(userId: string, eventId: string) {
  const supabase = getSupabaseAdmin();

  // Check if already RSVP'd
  const { data: existing } = await supabase
    .from("rsvps")
    .select("id, status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .limit(1);

  if (existing && existing.length > 0) {
    return {
      success: true,
      alreadyRsvpd: true,
      waitlisted: existing[0].status === "waitlisted",
      status: existing[0].status,
    };
  }

  // Check capacity: get event max_capacity and current confirmed count
  const { data: event } = await supabase
    .from("events")
    .select("max_capacity")
    .eq("id", eventId)
    .single();

  let status: "confirmed" | "waitlisted" = "confirmed";

  if (event?.max_capacity) {
    const { count } = await supabase
      .from("rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("status", "confirmed");

    if ((count ?? 0) >= event.max_capacity) {
      status = "waitlisted";
    }
  }

  const { error } = await supabase.from("rsvps").insert({
    user_id: userId,
    event_id: eventId,
    status,
  });

  if (error) {
    console.error("RSVP error:", error);
    return { success: false, error: error.message, waitlisted: false, status: null };
  }

  // Award points (only for confirmed, not waitlisted)
  if (status === "confirmed") {
    try {
      const { awardPoints } = await import("./points");
      const { data: creator } = await supabase
        .from("creators")
        .select("id")
        .eq("auth_id", userId)
        .single();
      if (creator) await awardPoints(creator.id, "rsvp");
    } catch {
      /* silent */
    }
  }

  return { success: true, alreadyRsvpd: false, waitlisted: status === "waitlisted", status };
}

export async function checkRsvp(userId: string, eventId: string) {
  const { data } = await getSupabaseAdmin()
    .from("rsvps")
    .select("id, status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .limit(1);

  return {
    hasRsvpd: !!(data && data.length > 0),
    status: data?.[0]?.status ?? null,
    waitlisted: data?.[0]?.status === "waitlisted",
  };
}

export async function checkInToEvent(userId: string, eventId: string) {
  const supabase = getSupabaseAdmin();

  // Get the RSVP
  const { data: rsvp } = await supabase
    .from("rsvps")
    .select("id, status")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .single();

  if (!rsvp) {
    return { success: false, error: "No RSVP found" };
  }

  if (rsvp.status === "checked_in") {
    return { success: true, alreadyCheckedIn: true };
  }

  const { error } = await supabase
    .from("rsvps")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", rsvp.id);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, alreadyCheckedIn: false };
}

export async function getWaitlistPosition(userId: string, eventId: string) {
  const supabase = getSupabaseAdmin();

  // Get the user's waitlisted RSVP
  const { data: myRsvp } = await supabase
    .from("rsvps")
    .select("id, created_at")
    .eq("user_id", userId)
    .eq("event_id", eventId)
    .eq("status", "waitlisted")
    .single();

  if (!myRsvp) return { position: 0 };

  // Count how many waitlisted RSVPs were created before this one
  const { count } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .eq("status", "waitlisted")
    .lt("created_at", myRsvp.created_at);

  return { position: (count ?? 0) + 1 };
}

export async function markNoShow(eventId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  // Set all confirmed (not checked_in) RSVPs to no_show
  const { error, count } = await getSupabaseAdmin()
    .from("rsvps")
    .update({ status: "no_show" })
    .eq("event_id", eventId)
    .eq("status", "confirmed");

  if (error) {
    return { error: error.message };
  }

  return { success: true, markedCount: count ?? 0 };
}

export async function promoteFromWaitlist(eventId: string) {
  const supabase = getSupabaseAdmin();

  // Get event capacity
  const { data: event } = await supabase
    .from("events")
    .select("max_capacity")
    .eq("id", eventId)
    .single();

  if (!event?.max_capacity) return { promoted: 0 };

  // Count current confirmed + checked_in
  const { count: activeCount } = await supabase
    .from("rsvps")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ["confirmed", "checked_in"]);

  const spotsAvailable = event.max_capacity - (activeCount ?? 0);
  if (spotsAvailable <= 0) return { promoted: 0 };

  // Get next waitlisted people in order
  const { data: waitlisted } = await supabase
    .from("rsvps")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "waitlisted")
    .order("created_at", { ascending: true })
    .limit(spotsAvailable);

  if (!waitlisted || waitlisted.length === 0) return { promoted: 0 };

  const ids = waitlisted.map((r) => r.id);
  await supabase
    .from("rsvps")
    .update({ status: "confirmed" })
    .in("id", ids);

  return { promoted: ids.length };
}
