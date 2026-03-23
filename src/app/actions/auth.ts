"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { generateUniqueSlug } from "@/lib/utils";

interface ClaimData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  inviteToken?: string;
}

export async function claimOrCreateCreator(data: ClaimData) {
  const { userId, firstName, lastName, email, inviteToken } = data;

  // Guard: check if email is already claimed
  const { data: alreadyClaimed } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .ilike("email", email)
    .eq("claimed", true)
    .limit(1);

  if (alreadyClaimed && alreadyClaimed.length > 0) {
    return { error: "This email already has a claimed profile. Try logging in instead." };
  }

  let existingId: string | null = null;

  // Priority 1: Token-based claim (from invitation email link)
  if (inviteToken) {
    const { data: tokenMatch } = await getSupabaseAdmin()
      .from("creators")
      .select("id")
      .eq("invite_token", inviteToken)
      .eq("claimed", false)
      .is("auth_id", null)
      .limit(1);
    if (tokenMatch?.length) existingId = tokenMatch[0].id;
  }

  // Priority 2: Email-based claim
  if (!existingId) {
    const { data: emailMatch } = await getSupabaseAdmin()
      .from("creators")
      .select("id")
      .ilike("email", email)
      .eq("claimed", false)
      .is("auth_id", null)
      .limit(1);
    if (emailMatch?.length) existingId = emailMatch[0].id;
  }

  // Priority 3: Name-based claim (fallback)
  if (!existingId) {
    const { data: nameMatch } = await getSupabaseAdmin()
      .from("creators")
      .select("id")
      .ilike("first_name", firstName)
      .ilike("last_name", lastName)
      .eq("claimed", false)
      .is("auth_id", null)
      .order("created_at", { ascending: true })
      .limit(1);
    if (nameMatch?.length) existingId = nameMatch[0].id;
  }

  const slug = await generateUniqueSlug(firstName, lastName);

  if (existingId) {
    // Claim existing row
    const { error } = await getSupabaseAdmin()
      .from("creators")
      .update({
        auth_id: userId,
        claimed: true,
        email,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingId);

    if (error) return { error: "Failed to claim profile." };
  } else {
    // Insert new row
    const { error } = await getSupabaseAdmin().from("creators").insert({
      auth_id: userId,
      first_name: firstName,
      last_name: lastName,
      email,
      slug,
      claimed: true,
      skills: "",
    });

    if (error) return { error: "Failed to create profile." };
  }

  return { success: true };
}

export async function logoutAction() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/");
}
