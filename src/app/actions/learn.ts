"use server";

import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";

export async function getAvailableExchanges() {
  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, avatar_url, slug, skills, can_teach, wants_to_learn")
    .or("can_teach.neq.{},wants_to_learn.neq.{}")
    .eq("claimed", true);

  return data || [];
}

export async function getSkillExchangeMatches() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get current user's creator profile
  const { data: me } = await getSupabaseAdmin()
    .from("creators")
    .select("id, can_teach, wants_to_learn")
    .eq("auth_id", user.id)
    .single();

  if (!me) return [];

  const myTeach = me.can_teach || [];
  const myLearn = me.wants_to_learn || [];
  if (myTeach.length === 0 && myLearn.length === 0) return [];

  // Get all creators with teaching/learning set
  const { data: all } = await getSupabaseAdmin()
    .from("creators")
    .select("id, first_name, last_name, avatar_url, slug, skills, can_teach, wants_to_learn")
    .neq("id", me.id)
    .eq("claimed", true);

  if (!all) return [];

  // Find matches: they teach what I want to learn OR they want to learn what I teach
  return all
    .map((creator) => {
      const theyTeach = creator.can_teach || [];
      const theyLearn = creator.wants_to_learn || [];
      const teachMatch = theyTeach.filter((s: string) => myLearn.includes(s));
      const learnMatch = theyLearn.filter((s: string) => myTeach.includes(s));
      const score = teachMatch.length + learnMatch.length;
      return { ...creator, teachMatch, learnMatch, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score);
}
