"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";

export async function sendConnectionRequest(toCreatorId: string, message?: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  // Get the current user's creator record
  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!creator) {
    return { error: "Creator profile not found." };
  }

  if (creator.id === toCreatorId) {
    return { error: "You cannot connect with yourself." };
  }

  // Check if a connection already exists in either direction
  const { data: existing } = await getSupabaseAdmin()
    .from("connections")
    .select("id, status")
    .or(
      `and(from_creator_id.eq.${creator.id},to_creator_id.eq.${toCreatorId}),and(from_creator_id.eq.${toCreatorId},to_creator_id.eq.${creator.id})`
    )
    .limit(1)
    .single();

  if (existing) {
    return { error: "Connection already exists." };
  }

  const { error } = await getSupabaseAdmin().from("connections").insert({
    from_creator_id: creator.id,
    to_creator_id: toCreatorId,
    message: message?.trim() || null,
    status: "pending",
  });

  if (error) {
    return { error: "Failed to send connection request." };
  }

  return { success: true };
}

export async function getConnectionStatus(fromCreatorId: string, toCreatorId: string) {
  const { data } = await getSupabaseAdmin()
    .from("connections")
    .select("id, status, from_creator_id, to_creator_id")
    .or(
      `and(from_creator_id.eq.${fromCreatorId},to_creator_id.eq.${toCreatorId}),and(from_creator_id.eq.${toCreatorId},to_creator_id.eq.${fromCreatorId})`
    )
    .limit(1)
    .single();

  if (!data) {
    return null;
  }

  return data as { id: string; status: string; from_creator_id: string; to_creator_id: string };
}

export async function getMyConnections() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated.", connections: [] };
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!creator) {
    return { error: "Creator profile not found.", connections: [] };
  }

  const { data: connections } = await getSupabaseAdmin()
    .from("connections")
    .select("id, from_creator_id, to_creator_id, message, status, created_at")
    .or(`from_creator_id.eq.${creator.id},to_creator_id.eq.${creator.id}`)
    .order("created_at", { ascending: false });

  return { connections: connections || [] };
}

export async function respondToConnection(connectionId: string, status: "accepted" | "declined") {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  if (!creator) {
    return { error: "Creator profile not found." };
  }

  // Verify this connection is addressed to the current user
  const { data: connection } = await getSupabaseAdmin()
    .from("connections")
    .select("id, to_creator_id")
    .eq("id", connectionId)
    .single();

  if (!connection || connection.to_creator_id !== creator.id) {
    return { error: "Not authorized to respond to this connection." };
  }

  const { error } = await getSupabaseAdmin()
    .from("connections")
    .update({ status })
    .eq("id", connectionId);

  if (error) {
    return { error: "Failed to update connection." };
  }

  return { success: true };
}
