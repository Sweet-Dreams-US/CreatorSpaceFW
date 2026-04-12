"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { awardPoints } from "./points";

export async function sendUserInvite(email: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return { error: "Creator not found" };

  if (!email || !email.includes("@")) return { error: "Invalid email" };

  // Check if already invited by this user
  const { data: existing } = await getSupabaseAdmin()
    .from("user_invites")
    .select("id")
    .eq("inviter_creator_id", creator.id)
    .eq("email", email.toLowerCase())
    .single();
  if (existing) return { error: "You already invited this person" };

  // Create invite record
  const { error } = await getSupabaseAdmin().from("user_invites").insert({
    inviter_creator_id: creator.id,
    email: email.toLowerCase(),
  });
  if (error) return { error: error.message };

  // Send invite email
  try {
    const { sendUserInviteEmail } = await import("@/lib/email");
    await sendUserInviteEmail(
      email,
      `${creator.first_name} ${creator.last_name}`
    );
  } catch { /* non-blocking */ }

  // Award points for inviting
  await awardPoints(creator.id, "invite_sent");

  return { success: true };
}

export async function getMyInvites() {
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
    .from("user_invites")
    .select("id, email, claimed, created_at")
    .eq("inviter_creator_id", creator.id)
    .order("created_at", { ascending: false });

  return data || [];
}

// Called during signup to track referral
export async function trackInviteClaim(email: string, newCreatorId: string) {
  const { data: invite } = await getSupabaseAdmin()
    .from("user_invites")
    .select("id, inviter_creator_id")
    .eq("email", email.toLowerCase())
    .eq("claimed", false)
    .limit(1)
    .single();

  if (invite) {
    await getSupabaseAdmin()
      .from("user_invites")
      .update({ claimed: true, claimed_by_creator_id: newCreatorId })
      .eq("id", invite.id);

    // Award bonus points to inviter for successful referral
    await awardPoints(invite.inviter_creator_id, "invite_claimed");
  }
}

// Admin analytics: top inviters
export async function getInviteLeaderboard() {
  const { data } = await getSupabaseAdmin()
    .from("user_invites")
    .select("inviter_creator_id");

  if (!data || data.length === 0) return [];

  const counts: Record<string, { sent: number; claimed: number }> = {};
  // Need claimed status too
  const { data: allInvites } = await getSupabaseAdmin()
    .from("user_invites")
    .select("inviter_creator_id, claimed");

  for (const inv of allInvites || []) {
    if (!counts[inv.inviter_creator_id]) counts[inv.inviter_creator_id] = { sent: 0, claimed: 0 };
    counts[inv.inviter_creator_id].sent++;
    if (inv.claimed) counts[inv.inviter_creator_id].claimed++;
  }

  const creatorIds = Object.keys(counts);
  const { data: creators } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, slug")
    .in("id", creatorIds);

  return (creators || []).map((c) => ({
    ...c,
    ...counts[c.id],
  })).sort((a, b) => b.sent - a.sent);
}
