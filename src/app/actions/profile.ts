"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";

export async function getMyProfile() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, company, job_title, social, website, bio, skills, avatar_url, slug, location, email_prefs, can_teach, wants_to_learn")
    .eq("auth_id", user.id)
    .single();

  return data;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }

  // Parse email_prefs if provided
  const emailPrefsRaw = formData.get("email_prefs") as string | null;
  let emailPrefs = undefined;
  if (emailPrefsRaw) {
    try {
      emailPrefs = JSON.parse(emailPrefsRaw);
    } catch {
      // Ignore malformed JSON
    }
  }

  // Parse teaching fields
  const canTeachRaw = formData.get("can_teach") as string | null;
  const wantsToLearnRaw = formData.get("wants_to_learn") as string | null;
  let canTeach: string[] | undefined;
  let wantsToLearn: string[] | undefined;
  if (canTeachRaw) {
    try { canTeach = JSON.parse(canTeachRaw); } catch { /* ignore */ }
  }
  if (wantsToLearnRaw) {
    try { wantsToLearn = JSON.parse(wantsToLearnRaw); } catch { /* ignore */ }
  }

  const updateData: Record<string, unknown> = {
    first_name: firstName,
    last_name: lastName,
    company: (formData.get("company") as string)?.trim() || null,
    job_title: (formData.get("job_title") as string)?.trim() || null,
    social: (formData.get("social") as string)?.trim() || null,
    website: (formData.get("website") as string)?.trim() || null,
    bio: (formData.get("bio") as string)?.trim() || null,
    skills: (formData.get("skills") as string)?.trim() || "",
    location: (formData.get("location") as string)?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (canTeach !== undefined) updateData.can_teach = canTeach;
  if (wantsToLearn !== undefined) updateData.wants_to_learn = wantsToLearn;

  if (emailPrefs !== undefined) {
    updateData.email_prefs = emailPrefs;
  }

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update(updateData)
    .eq("auth_id", user.id);

  if (error) {
    return { error: "Failed to update profile." };
  }

  revalidatePath("/directory");
  return { success: true };
}

export async function adminUpdateProfile(creatorId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.email)) {
    return { error: "Not authorized." };
  }

  const firstName = (formData.get("first_name") as string)?.trim();
  const lastName = (formData.get("last_name") as string)?.trim();

  if (!firstName || !lastName) {
    return { error: "First and last name are required." };
  }

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update({
      first_name: firstName,
      last_name: lastName,
      company: (formData.get("company") as string)?.trim() || null,
      job_title: (formData.get("job_title") as string)?.trim() || null,
      social: (formData.get("social") as string)?.trim() || null,
      website: (formData.get("website") as string)?.trim() || null,
      bio: (formData.get("bio") as string)?.trim() || null,
      skills: (formData.get("skills") as string)?.trim() || "",
      location: (formData.get("location") as string)?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", creatorId);

  if (error) {
    return { error: "Failed to update profile." };
  }

  revalidatePath("/directory");
  return { success: true };
}

export async function updateAvatarUrl(url: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated." };
  }

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update({ avatar_url: url, updated_at: new Date().toISOString() })
    .eq("auth_id", user.id);

  if (error) {
    return { error: "Failed to update avatar." };
  }

  revalidatePath("/directory");
  return { success: true };
}
