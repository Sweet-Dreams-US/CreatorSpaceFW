import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CommunityNav from "@/components/ui/CommunityNav";
import BlogBody from "@/components/blog/BlogBody";
import BlogToc from "@/components/blog/BlogToc";
import BlogJsonLd from "@/components/blog/BlogJsonLd";
import { formatReleaseDate, getReleasedPost, getReleasedPosts, resolveBlogHref } from "@/lib/blog";
import { extractHeadings, parseBlocks } from "@/lib/blog-markdown";

type Props = { params: Promise<{ slug: string }> };

// Release happens on a date, not on a deploy: the page is rebuilt at least hourly.
export const revalidate = 3600;

// Only posts that are already released are built ahead of time. Any other slug
// is checked against its date when it is asked for, and is a 404 until then.
export async function generateStaticParams() {
  return (await getReleasedPosts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getReleasedPost(slug);
  if (!post) return {};
  const description = post.description || post.title;
  const cover = post.cover_image ? resolveBlogHref(post.cover_image) : "";
  return {
    title: post.title,
    description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      title: `${post.title} | Creator Space Fort Wayne`,
      description,
      url: `/blog/${post.slug}`,
      publishedTime: post.release_on,
      ...(cover.startsWith("/") && { images: [{ url: cover }] }),
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getReleasedPost(slug);
  if (!post) notFound();

  const blocks = parseBlocks(post.body);
  const sections = extractHeadings(blocks);
  const cover = post.cover_image ? resolveBlogHref(post.cover_image) : "";

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-32 pt-16 lg:pb-24">
      <BlogJsonLd post={post} />

      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 20%, #fa927730, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <CommunityNav />

        <article className="mt-10 max-w-2xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
          >
            <span aria-hidden="true">←</span> All posts
          </Link>

          <header className="mt-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest">
              <time dateTime={post.release_on} className="text-[var(--color-coral)]">
                {formatReleaseDate(post.release_on)}
              </time>
              <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--color-ash)]" />
              <span className="text-[var(--color-smoke)]">{post.reading_minutes} min read</span>
            </div>
            <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl leading-[1.1] text-[var(--color-white)] sm:text-5xl">
              {post.title}
            </h1>
            {post.description && (
              <p className="mt-5 font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-smoke)]">
                {post.description}
              </p>
            )}
          </header>

          {cover.startsWith("/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={cover} alt="" className="mt-8 w-full rounded-xl border border-white/5" />
          )}

          <div className="mt-2">
            <BlogBody blocks={blocks} />
          </div>

          {post.sources.length > 0 && (
            <section
              aria-labelledby="post-sources"
              className="mt-16 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 sm:p-8"
            >
              <h2
                id="post-sources"
                className="font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-widest text-[var(--color-coral)]"
              >
                Sources
              </h2>
              <ul className="mt-4 space-y-4">
                {post.sources.map((s) => (
                  <li key={s.url} className="font-[family-name:var(--font-mono)] text-xs leading-relaxed">
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--color-white)] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[var(--color-coral)] hover:decoration-[var(--color-coral)]"
                    >
                      {s.title}
                    </a>
                    {s.author && <p className="mt-1 text-[var(--color-smoke)]">{s.author}</p>}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </article>
      </div>

      <BlogToc sections={sections} />
    </main>
  );
}
