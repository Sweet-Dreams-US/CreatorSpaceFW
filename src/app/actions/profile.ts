"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { generateUniqueSlug } from "@/lib/utils";

/**
 * If the name has changed, generate a new slug and preserve the old one
 * in `previous_slugs` so old URLs keep working (handled by the redirect
 * in src/app/directory/[slug]/page.tsx).
 *
 * Returns the fields to merge into the row update — `{}` if nothing changes.
 */
async function computeSlugUpdate(
  matchColumn: "auth_id" | "id",
  matchValue: string,
  newFirst: string,
  newLast: string
): Promise<{ slug?: string; previous_slugs?: string[] }> {
  const { data: existing } = await getSupabaseAdmin()
    .from("creators")
    .select("first_name, last_name, slug, previous_slugs")
    .eq(matchColumn, matchValue)
    .single();

  if (!existing) return {};
  if (existing.first_name === newFirst && existing.last_name === newLast) return {};

  const newSlug = await generateUniqueSlug(newFirst, newLast);
  if (newSlug === existing.slug) return {};

  const history: string[] = existing.previous_slugs || [];
  const oldSlug = existing.slug;
  const updatedHistory =
    oldSlug && !history.includes(oldSlug) ? [...history, oldSlug] : history;

  return { slug: newSlug, previous_slugs: updatedHistory };
}

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

  // Generate new slug if the name changed (old slug kept in previous_slugs)
  const slugUpdate = await computeSlugUpdate("auth_id", user.id, firstName, lastName);
  Object.assign(updateData, slugUpdate);

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update(updateData)
    .eq("auth_id", user.id);

  if (error) {
    return { error: "Failed to update profile." };
  }

  revalidatePath("/directory");
  if (slugUpdate.slug) revalidatePath(`/directory/${slugUpdate.slug}`);
  return { success: true, newSlug: slugUpdate.slug ?? null };
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

  // Build update object so we can merge slug changes if the name was edited
  const adminUpdate: Record<string, unknown> = {
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

  const adminSlugUpdate = await computeSlugUpdate("id", creatorId, firstName, lastName);
  Object.assign(adminUpdate, adminSlugUpdate);

  const { error } = await getSupabaseAdmin()
    .from("creators")
    .update(adminUpdate)
    .eq("id", creatorId);

  if (error) {
    return { error: "Failed to update profile." };
  }

  revalidatePath("/directory");
  if (adminSlugUpdate.slug) revalidatePath(`/directory/${adminSlugUpdate.slug}`);
  return { success: true, newSlug: adminSlugUpdate.slug ?? null };
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
