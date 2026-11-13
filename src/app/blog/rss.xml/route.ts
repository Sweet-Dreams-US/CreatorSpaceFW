import { getReleasedPosts, SITE_URL, SITE_NAME } from "@/lib/blog";

// Time based, so a post enters the feed on its release date without a deploy.
export const revalidate = 3600;

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function GET() {
  const posts = await getReleasedPosts();

  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}</link>
      <guid isPermaLink="true">${SITE_URL}/blog/${p.slug}</guid>
      <pubDate>${new Date(`${p.release_on}T12:00:00Z`).toUTCString()}</pubDate>
      <description>${escapeXml(p.description)}</description>
    </item>`,
    )
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
  <title>${escapeXml(SITE_NAME)} Blog</title>
  <link>${SITE_URL}/blog</link>
  <description>Articles from ${escapeXml(SITE_NAME)}.</description>
  <language>en-us</language>${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
