import { notFound } from "next/navigation";
import Link from "next/link";
import { getCollabPost } from "@/app/actions/collaborate";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import CollabDetailClient from "./CollabDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function CollabDetailPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getCollabPost(id);

  if (!post) return notFound();

  // Get current user's creator ID to check ownership and response status
  let currentCreatorId: string | null = null;
  let hasResponded = false;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: creator } = await getSupabaseAdmin()
        .from("creators")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (creator) {
        currentCreatorId = creator.id;
        // Check if already responded
        const { data: existingResponse } = await getSupabaseAdmin()
          .from("collab_responses")
          .select("id")
          .eq("post_id", id)
          .eq("creator_id", creator.id)
          .maybeSingle();
        hasResponded = !!existingResponse;
      }
    }
  } catch {
    // Not logged in
  }

  const isOwner = currentCreatorId === post.creator_id;

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #d377fa20, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/collaborate"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          &larr; Back to Collaborate
        </Link>

        {/* Post header */}
        <div className="mt-6">
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase"
              style={{
                backgroundColor:
                  post.type === "looking_for"
                    ? "var(--color-coral)"
                    : "var(--color-lime)",
                color: "var(--color-black)",
              }}
            >
              {post.type === "looking_for" ? "Looking For" : "Offering"}
            </span>
            {post.category && (
              <span className="rounded-full border border-[var(--color-ash)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                {post.category}
              </span>
            )}
            <span
              className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs"
              style={{
                backgroundColor:
                  post.status === "open"
                    ? "var(--color-charcoal)"
                    : "var(--color-ash)",
                color:
                  post.status === "open"
                    ? "var(--color-lime)"
                    : "var(--color-smoke)",
              }}
            >
              {post.status}
            </span>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-5xl">
            {post.title}
          </h1>

          {/* Poster info */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
              {post.creators?.avatar_url ? (
                <img
                  src={post.creators.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-[family-name:var(--font-display)] text-sm text-[var(--color-mist)]">
                  {(post.creators?.first_name?.[0] || "") +
                    (post.creators?.last_name?.[0] || "")}
                </span>
              )}
            </div>
            <div>
              <Link
                href={
                  post.creators?.slug
                    ? `/directory/${post.creators.slug}`
                    : "#"
                }
                className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)] transition-colors hover:text-[var(--color-coral)]"
              >
                {post.creators?.first_name} {post.creators?.last_name}
              </Link>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                Posted{" "}
                {new Date(post.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="mt-8 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
          {post.description && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] leading-relaxed whitespace-pre-wrap">
              {post.description}
            </p>
          )}

          {(post.budget || post.deadline) && (
            <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-4">
              {post.budget && (
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                    Budget
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
                    ${post.budget}
                  </p>
                </div>
              )}
              {post.deadline && (
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                    Deadline
                  </p>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-sky)]">
                    {new Date(post.deadline).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Interactive section */}
        <CollabDetailClient
          postId={id}
          isOwner={isOwner}
          isLoggedIn={!!currentCreatorId}
          hasResponded={hasResponded}
          postStatus={post.status}
          responses={post.responses || []}
        />
      </div>
    </main>
  );
}
