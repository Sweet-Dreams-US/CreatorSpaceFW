"use server";

import { redirect } from "next/navigation";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import { generateUniqueSlug } from "@/lib/utils";

interface ClaimData {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
}

export async function claimOrCreateCreator(data: ClaimData) {
  const { userId, firstName, lastName, email } = data;

  // Dedup: try to claim an existing unclaimed row with matching name
  const { data: existing } = await supabaseAdmin
    .from("creators")
    .select("id")
    .ilike("first_name", firstName)
    .ilike("last_name", lastName)
    .eq("claimed", false)
    .is("auth_id", null)
    .order("created_at", { ascending: true })
    .limit(1);

  const slug = await generateUniqueSlug(firstName, lastName);

  if (existing && existing.length > 0) {
    // Claim existing row
    const { error } = await supabaseAdmin
      .from("creators")
      .update({
        auth_id: userId,
        claimed: true,
        email,
        slug,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing[0].id);

    if (error) return { error: "Failed to claim profile." };
  } else {
    // Insert new row
    const { error } = await supabaseAdmin.from("creators").insert({
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
