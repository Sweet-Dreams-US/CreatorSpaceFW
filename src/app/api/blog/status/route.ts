import { NextResponse } from "next/server";
import { hasReleasedPosts } from "@/lib/blog";

/**
 * Whether the navigation should show the Blog link: true once at least one
 * post has released. It reads the posts on every call (a few small files), so
 * the link appears and disappears without a deploy.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    { hasBlog: await hasReleasedPosts() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
