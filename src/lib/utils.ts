import { supabaseAdmin } from "./supabase-server";

export async function generateUniqueSlug(
  firstName: string,
  lastName: string
): Promise<string> {
  const base = `${firstName}-${lastName}`
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]/g, "");

  // Check if base slug is available
  const { data } = await supabaseAdmin
    .from("creators")
    .select("slug")
    .like("slug", `${base}%`);

  const existingSlugs = new Set((data || []).map((r) => r.slug));

  if (!existingSlugs.has(base)) return base;

  let counter = 2;
  while (existingSlugs.has(`${base}-${counter}`)) {
    counter++;
  }
  return `${base}-${counter}`;
}
