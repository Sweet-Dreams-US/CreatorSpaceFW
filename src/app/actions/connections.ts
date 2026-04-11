"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { createNotification } from "./notifications";

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

  // Verify target creator exists
  const { data: targetCreator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("id", toCreatorId)
    .single();
  if (!targetCreator) return { error: "Creator not found." };

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

  // In-app notification to the receiver
  const { data: senderInfo } = await getSupabaseAdmin()
    .from("creators")
    .select("first_name, last_name, slug")
    .eq("id", creator.id)
    .single();
  if (senderInfo) {
    await createNotification({
      creatorId: toCreatorId,
      type: "connection_request",
      title: `${senderInfo.first_name} ${senderInfo.last_name} wants to connect`,
      body: message?.trim() || undefined,
      link: `/directory/${senderInfo.slug}`,
    });
  }

  // Email notification to the receiver
  try {
    const { data: sender } = await getSupabaseAdmin()
      .from("creators")
      .select("first_name, last_name, slug")
      .eq("id", creator.id)
      .single();
    const { data: receiver } = await getSupabaseAdmin()
      .from("creators")
      .select("first_name, auth_id, slug")
      .eq("id", toCreatorId)
      .single();
    if (sender && receiver?.auth_id) {
      const { data: authUser } = await getSupabaseAdmin().auth.admin.getUserById(receiver.auth_id);
      if (authUser?.user?.email) {
        const { sendConnectionRequestEmail } = await import("@/lib/email");
        await sendConnectionRequestEmail(
          authUser.user.email,
          receiver.first_name || "Creator",
          `${sender.first_name} ${sender.last_name}`,
          sender.slug || "",
          message?.trim()
        );
      }
    }
  } catch {
    // Email is non-blocking
  }

  return { success: true };
}

export async function getConnectionStatus(fromCreatorId: string, toCreatorId: string) {
  // Require auth — only allow checking your own connection status
  const authClient = await createServerSupabaseClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) return null;

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

  if (!connections || connections.length === 0) {
    return { connections: [], myCreatorId: creator.id };
  }

  // Fetch creator details for all connected users
  const creatorIds = new Set<string>();
  for (const c of connections) {
    creatorIds.add(c.from_creator_id);
    creatorIds.add(c.to_creator_id);
  }
  creatorIds.delete(creator.id);

  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, avatar_url, slug, skills")
    .in("id", Array.from(creatorIds));

  const creatorMap: Record<string, { first_name: string; last_name: string; avatar_url: string | null; slug: string | null; skills: string | null }> = {};
  for (const c of creators || []) {
    creatorMap[c.id] = c;
  }

  const enriched = connections.map((conn) => {
    const otherId = conn.from_creator_id === creator.id ? conn.to_creator_id : conn.from_creator_id;
    return {
      ...conn,
      isSender: conn.from_creator_id === creator.id,
      otherCreator: creatorMap[otherId] || null,
    };
  });

  return { connections: enriched, myCreatorId: creator.id };
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

  // Notify the sender about the decision
  try {
    const { data: conn } = await getSupabaseAdmin()
      .from("connections")
      .select("from_creator_id")
      .eq("id", connectionId)
      .single();
    const { data: responder } = await getSupabaseAdmin()
      .from("creators")
      .select("first_name, last_name, slug")
      .eq("id", creator.id)
      .single();
    if (conn && responder) {
      await createNotification({
        creatorId: conn.from_creator_id,
        type: status === "accepted" ? "connection_accepted" : "general",
        title: status === "accepted"
          ? `${responder.first_name} ${responder.last_name} accepted your connection`
          : `${responder.first_name} ${responder.last_name} declined your connection`,
        link: `/directory/${responder.slug}`,
      });
    }
  } catch { /* silent */ }

  // Award points to both creators on accepted connection
  if (status === "accepted") {
    try {
      const { awardPoints } = await import("./points");
      const { data: conn } = await getSupabaseAdmin()
        .from("connections")
        .select("from_creator_id, to_creator_id")
        .eq("id", connectionId)
        .single();
      if (conn) {
        await awardPoints(conn.from_creator_id, "connection_made");
        await awardPoints(conn.to_creator_id, "connection_made");
      }
    } catch { /* silent */ }
  }

  return { success: true };
}
