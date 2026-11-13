import { readFile } from "node:fs/promises";
import path from "node:path";
import { BLOG_DIR, getReleasedPost } from "@/lib/blog";

// Post images live in content/blog/images/<slug>/. A post's images are served
// only once the post itself is released.
export const revalidate = 3600;

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
};

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string; file: string }> }) {
  const { slug, file } = await params;
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || !/^[a-z0-9-]+$/.test(slug) || !/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(file) || file.includes("..")) {
    return new Response("Not found", { status: 404 });
  }
  if (!(await getReleasedPost(slug))) return new Response("Not found", { status: 404 });

  try {
    const data = await readFile(path.join(BLOG_DIR, "images", slug, file));
    return new Response(new Uint8Array(data), {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=3600, s-maxage=86400" },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
