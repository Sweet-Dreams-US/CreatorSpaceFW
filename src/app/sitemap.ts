import { createClient } from "@supabase/supabase-js";
import type { MetadataRoute } from "next";
import { DB_SCHEMA } from "@/lib/supabase-config";
import { getReleasedPosts } from "@/lib/blog";

// Rebuilt at least hourly, so a blog post enters the sitemap on its release date without a deploy.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://creatorspacefw.com";

  // Use inline client to avoid importing supabaseAdmin which fails at build
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let creators: { slug: string; updated_at: string | null }[] = [];
  if (url && key) {
    const supabase = createClient(url, key, { db: { schema: DB_SCHEMA } });
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

  const now = new Date().toISOString();

  // Released posts only. The Blog index is listed once there is at least one.
  const posts = await getReleasedPosts();
  const blogEntries: MetadataRoute.Sitemap = posts.length
    ? [
        { url: `${baseUrl}/blog`, lastModified: new Date(`${posts[0].release_on}T12:00:00Z`), changeFrequency: "weekly", priority: 0.7 },
        ...posts.map((p) => ({
          url: `${baseUrl}/blog/${p.slug}`,
          lastModified: new Date(`${p.release_on}T12:00:00Z`),
          changeFrequency: "monthly" as const,
          priority: 0.6,
        })),
      ]
    : [];

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${baseUrl}/directory`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/collaborate`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/resources`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${baseUrl}/challenges`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${baseUrl}/learn`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/hire`, lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/spotlight`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...blogEntries,
    ...creatorEntries,
  ];
}
