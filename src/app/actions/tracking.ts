"use server";

import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";

export async function logPageView(path: string, referrer?: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabaseAdmin.from("page_views").insert({
      path,
      referrer: referrer || null,
      user_id: user?.id || null,
    });

    return { success: true };
  } catch {
    // Silently fail — tracking should never break the app
    return { success: false };
  }
}

export async function logProfileView(creatorId: string) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabaseAdmin.from("profile_views").insert({
      creator_id: creatorId,
      viewer_id: user?.id || null,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function reportError(
  page: string,
  errorMessage: string,
  extra?: object
) {
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabaseAdmin.from("error_reports").insert({
      page,
      error_message: errorMessage,
      user_id: user?.id || null,
      user_agent: null,
      extra: extra || null,
    });

    return { success: true };
  } catch {
    return { success: false };
  }
}
