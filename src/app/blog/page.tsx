import type { Metadata } from "next";
import Link from "next/link";
import CommunityNav from "@/components/ui/CommunityNav";
import { formatReleaseDate, getReleasedPosts } from "@/lib/blog";

// Posts release on a date, not on a deploy: the page is rebuilt at least hourly.
export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const hasPosts = (await getReleasedPosts()).length > 0;
  return {
    title: "Blog",
    description: "Articles for Fort Wayne creators from Creator Space Fort Wayne.",
    alternates: {
      canonical: "/blog",
      types: { "application/rss+xml": "/blog/rss.xml" },
    },
    openGraph: {
      title: "Blog | Creator Space Fort Wayne",
      description: "Articles for Fort Wayne creators from Creator Space Fort Wayne.",
      url: "/blog",
    },
    robots: hasPosts ? undefined : { index: false, follow: true },
  };
}

export default async function BlogIndexPage() {
  const posts = await getReleasedPosts();

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background: "radial-gradient(ellipse 60% 40% at 50% 20%, #fa927730, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <CommunityNav />

        {/* Header */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          BLOG
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Articles for Fort Wayne creators
        </p>

        {posts.length === 0 ? (
          <div className="mt-12 rounded-xl border border-white/5 bg-[var(--color-dark)] p-12 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
              No posts yet
            </p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Check back soon.
            </p>
          </div>
        ) : (
          <ul className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 transition-all duration-300 hover:border-[var(--color-coral)]/40 hover:shadow-[0_0_40px_rgba(250,146,119,0.08)] sm:p-8"
                >
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest">
                    <time dateTime={post.release_on} className="text-[var(--color-coral)]">
                      {formatReleaseDate(post.release_on)}
                    </time>
                    <span aria-hidden="true" className="h-1 w-1 rounded-full bg-[var(--color-ash)]" />
                    <span className="text-[var(--color-smoke)]">{post.reading_minutes} min read</span>
                  </div>
                  <h2 className="mt-4 font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--color-white)] transition-colors group-hover:text-[var(--color-coral)] sm:text-3xl">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="mt-3 flex-1 font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-smoke)]">
                      {post.description}
                    </p>
                  )}
                  <span className="mt-6 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-coral)]">
                    Read the post
                    <span aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
