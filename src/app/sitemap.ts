import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://creatorspacefw.com";

  // Use inline client to avoid importing supabaseAdmin which fails at build
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let creators: { slug: string; updated_at: string | null }[] = [];
  if (url && key) {
    const supabase = createClient(url, key);
    const { data } = await supabase
      .from("creators")
      .select("slug, updated_at")
      .not("slug", "is", null);
    creators = data || [];
  }

  const creatorEntries: MetadataRoute.Sitemap = (creators || []).map((c) => ({
    url: `${baseUrl}/directory/${c.slug}`,
    lastModified: c.updated_at || new Date().toISOString(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: new Date().toISOString(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...creatorEntries,
  ];
}
