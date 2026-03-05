import { NextResponse } from "next/server";

const TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const CACHE_SECONDS = 3600; // cache for 1 hour

export async function GET() {
  if (!TOKEN) {
    return NextResponse.json({ posts: [] });
  }

  try {
    const res = await fetch(
      `https://graph.instagram.com/me/media?fields=id,media_url,permalink,media_type,thumbnail_url&limit=12&access_token=${TOKEN}`,
      { next: { revalidate: CACHE_SECONDS } }
    );

    if (!res.ok) {
      console.error("Instagram API error:", res.status, await res.text());
      return NextResponse.json({ posts: [] });
    }

    const data = await res.json();
    return NextResponse.json({ posts: data.data || [] });
  } catch (e) {
    console.error("Instagram fetch error:", e);
    return NextResponse.json({ posts: [] });
  }
}
