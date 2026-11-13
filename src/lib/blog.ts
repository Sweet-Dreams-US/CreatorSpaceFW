import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Blog posts are markdown files in content/blog (YYYY-MM-DD-slug.md). The
 * publishing routine puts them there; this module only reads them and decides
 * which ones may be seen.
 *
 * A post is visible on and after its `release_on` date in Fort Wayne time.
 * Nothing is decided at build time: every page and route that reads posts
 * revalidates at least hourly (or runs per request), so a post appears on its
 * date without a deploy. A post with no valid release_on is never shown.
 *
 * Server only. It reads the disk, so never import it from a client component.
 */

export const BLOG_DIR = path.join(process.cwd(), "content", "blog");
export const BLOG_TIME_ZONE = "America/Indiana/Indianapolis";
export const SITE_URL = "https://creatorspacefw.com";
export const SITE_NAME = "Creator Space Fort Wayne";

export interface BlogSource {
  title: string;
  author?: string;
  url: string;
}

export interface BlogPost {
  post_id: string;
  seq: number;
  title: string;
  slug: string;
  /** YYYY-MM-DD, compared as a plain string with today's Fort Wayne date. */
  release_on: string;
  description: string;
  reading_minutes: number;
  cover_image?: string;
  sources: BlogSource[];
  /** Markdown body, after the front matter block. */
  body: string;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Fort Wayne time as YYYY-MM-DD, so it compares as a string with release_on. */
export function todayInFortWayne(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BLOG_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isReleased(post: Pick<BlogPost, "release_on">, today = todayInFortWayne()): boolean {
  return DATE_RE.test(post.release_on) && post.release_on <= today;
}

export function formatReleaseDate(releaseOn: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${releaseOn}T00:00:00Z`));
}

/* ------------------------------------------------------------ Front matter */

type FrontMatterValue = string | Record<string, string>[];

function unquote(value: string): string {
  const v = value.trim();
  if (v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")))) {
    return v.slice(1, -1);
  }
  return v;
}

/**
 * A small parser for the fixed front matter shape in BLOG-FORMAT.md: plain
 * `key: value` lines, plus one list of maps (`sources`). It is not general
 * YAML, because both ends of this file format are ours.
 */
function parseFrontMatter(raw: string): Record<string, FrontMatterValue> {
  const lines = raw.split("\n");
  const out: Record<string, FrontMatterValue> = {};
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!m) {
      i++;
      continue;
    }
    const [, key, rest] = m;
    if (rest.trim() !== "") {
      out[key] = unquote(rest);
      i++;
      continue;
    }
    const items: Record<string, string>[] = [];
    let j = i + 1;
    while (j < lines.length && /^\s*-\s/.test(lines[j])) {
      const item: Record<string, string> = {};
      const first = lines[j].match(/^\s*-\s*([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
      if (first) item[first[1]] = unquote(first[2]);
      j++;
      while (j < lines.length && /^\s{2,}[A-Za-z_]/.test(lines[j]) && !/^\s*-\s/.test(lines[j])) {
        const kv = lines[j].match(/^\s*([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
        if (kv) item[kv[1]] = unquote(kv[2]);
        j++;
      }
      items.push(item);
    }
    out[key] = items;
    i = items.length ? j : i + 1;
  }
  return out;
}

function parsePost(filename: string, raw: string): BlogPost | null {
  const text = raw.replace(/\r\n?/g, "\n");
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    console.error(`[blog] ${filename}: no front matter block, skipped`);
    return null;
  }
  const fm = parseFrontMatter(match[1]);
  const str = (k: string) => (typeof fm[k] === "string" ? (fm[k] as string) : "");

  const post_id = str("post_id");
  const title = str("title");
  const slug = str("slug");
  if (!post_id || !title || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    console.error(`[blog] ${filename}: missing post_id, title or a valid slug, skipped`);
    return null;
  }

  const rawSources = fm.sources;
  const sources: BlogSource[] = Array.isArray(rawSources)
    ? rawSources
        .filter((s) => s.title && /^https?:\/\//i.test(s.url || ""))
        .map((s) => ({ title: s.title, author: s.author || undefined, url: s.url }))
    : [];

  return {
    post_id,
    seq: Number(str("seq")) || 0,
    title,
    slug,
    release_on: str("release_on"),
    description: str("description"),
    reading_minutes: Number(str("reading_minutes")) || 1,
    cover_image: str("cover_image") || undefined,
    sources,
    body: match[2].trim(),
  };
}

async function readAllPosts(): Promise<BlogPost[]> {
  let files: string[];
  try {
    files = (await readdir(BLOG_DIR)).filter((f) => f.endsWith(".md"));
  } catch {
    return [];
  }
  const parsed = await Promise.all(
    files.map(async (file) => parsePost(file, await readFile(path.join(BLOG_DIR, file), "utf8"))),
  );
  // One post per post_id. A dated copy wins over an undated one.
  const byId = new Map<string, BlogPost>();
  for (const p of parsed) {
    if (!p) continue;
    const existing = byId.get(p.post_id);
    if (!existing || (!isDated(existing) && isDated(p))) byId.set(p.post_id, p);
  }
  return [...byId.values()];
}

function isDated(p: Pick<BlogPost, "release_on">): boolean {
  return DATE_RE.test(p.release_on);
}

/** Newest release first. Posts released on the same day are ordered by seq, latest first. */
function newestFirst(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) =>
    a.release_on === b.release_on ? b.seq - a.seq : a.release_on < b.release_on ? 1 : -1,
  );
}

/** Released posts only, newest first. Every page, the sitemap and the feed use this. */
export async function getReleasedPosts(): Promise<BlogPost[]> {
  const today = todayInFortWayne();
  return newestFirst((await readAllPosts()).filter((p) => isReleased(p, today)));
}

/** One released post, or null (a 404) when it does not exist or its date has not come. */
export async function getReleasedPost(slug: string): Promise<BlogPost | null> {
  return (await getReleasedPosts()).find((p) => p.slug === slug) ?? null;
}

export async function hasReleasedPosts(): Promise<boolean> {
  return (await getReleasedPosts()).length > 0;
}

/**
 * Maps a path written in a post to a URL that works on this site.
 * `images/<slug>/<file>` is served by /blog/images/<slug>/<file>.
 * The site has no /contact page, so a link to it goes to the real inquiry form.
 */
export function resolveBlogHref(href: string): string {
  const h = href.trim();
  if (/^images\/[a-z0-9-]+\/[A-Za-z0-9._-]+$/.test(h)) return `/blog/${h}`;
  if (h === "/contact" || h === "/contact/") return "/hire";
  return h;
}
