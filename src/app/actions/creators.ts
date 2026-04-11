"use server";

import { getSupabaseAdmin } from "@/lib/supabase-server";
import { generateUniqueSlug } from "@/lib/utils";
import { verifyTurnstileToken } from "@/lib/turnstile";

interface JoinFormData {
  first_name: string;
  last_name: string;
  email: string;
  social?: string;
  company?: string;
  job_title?: string;
  skills: string;
  turnstileToken?: string;
}

export async function getPublicCreators() {
  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, company, job_title, skills, slug, avatar_url, badges")
    .order("created_at", { ascending: false });
  return data || [];
}

export async function joinCreatorDatabase(data: JoinFormData) {
  // Verify Turnstile token (server-side)
  if (data.turnstileToken) {
    const valid = await verifyTurnstileToken(data.turnstileToken);
    if (!valid) {
      return { success: false, error: "Security verification failed. Please try again." };
    }
  } else if (process.env.TURNSTILE_SECRET_KEY) {
    return { success: false, error: "Security verification required." };
  }

  // Validate required fields
  if (!data.first_name?.trim() || !data.last_name?.trim() || !data.email?.trim() || !data.skills?.trim()) {
    return { success: false, error: "Please fill in all required fields." };
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(data.email.trim())) {
    return { success: false, error: "Please enter a valid email address." };
  }

  const slug = await generateUniqueSlug(
    data.first_name.trim(),
    data.last_name.trim()
  );

  const { error } = await getSupabaseAdmin().from("creators").insert({
    first_name: data.first_name.trim(),
    last_name: data.last_name.trim(),
    email: data.email.trim(),
    social: data.social?.trim() || null,
    company: data.company?.trim() || null,
    job_title: data.job_title?.trim() || null,
    skills: data.skills.trim(),
    slug,
  });

  if (error) {
    if (error.code === "23505") {
      return { success: false, error: "This email is already registered." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
