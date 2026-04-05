"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  respondToCollabPost,
  updateCollabPostStatus,
} from "@/app/actions/collaborate";

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
}

interface Response {
  id: string;
  creator_id: string;
  message: string | null;
  created_at: string;
  creators: Creator;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CollabDetailClient({
  postId,
  isOwner,
  isLoggedIn,
  hasResponded: initialHasResponded,
  postStatus,
  responses,
}: {
  postId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  hasResponded: boolean;
  postStatus: string;
  responses: Response[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [hasResponded, setHasResponded] = useState(initialHasResponded);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function handleRespond(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await respondToCollabPost(postId, message.trim());
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setHasResponded(true);
    setMessage("");
    router.refresh();
  }

  async function handleStatusChange(status: string) {
    setStatusUpdating(true);
    await updateCollabPostStatus(postId, status);
    setStatusUpdating(false);
    router.refresh();
  }

  return (
    <div className="mt-8">
      {/* Owner view: responses + status controls */}
      {isOwner && (
        <>
          {/* Status controls */}
          {postStatus === "open" && (
            <div className="mb-6 flex gap-3">
              <button
                onClick={() => handleStatusChange("filled")}
                disabled={statusUpdating}
                className="rounded-full border border-[var(--color-lime)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)] transition-all hover:bg-[var(--color-lime)] hover:text-[var(--color-black)] disabled:opacity-50"
              >
                {statusUpdating ? "Updating..." : "Mark Filled"}
              </button>
              <button
                onClick={() => handleStatusChange("closed")}
                disabled={statusUpdating}
                className="rounded-full border border-[var(--color-smoke)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:bg-[var(--color-smoke)] hover:text-[var(--color-black)] disabled:opacity-50"
              >
                {statusUpdating ? "Updating..." : "Close"}
              </button>
            </div>
          )}

          {/* Responses list */}
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            Responses ({responses.length})
          </h3>

          {responses.length === 0 ? (
            <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              No responses yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {responses.map((resp) => (
                <div
                  key={resp.id}
                  className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-4 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                      {resp.creators?.avatar_url ? (
                        <img
                          src={resp.creators.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-[family-name:var(--font-display)] text-[10px] text-[var(--color-mist)]">
                          {(resp.creators?.first_name?.[0] || "") +
                            (resp.creators?.last_name?.[0] || "")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={
                          resp.creators?.slug
                            ? `/directory/${resp.creators.slug}`
                            : "#"
                        }
                        className="font-[family-name:var(--font-display)] text-sm text-[var(--color-white)] transition-colors hover:text-[var(--color-coral)]"
                      >
                        {resp.creators?.first_name} {resp.creators?.last_name}
                      </Link>
                      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {timeAgo(resp.created_at)}
                      </p>
                    </div>
                  </div>
                  {resp.message && (
                    <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] leading-relaxed">
                      {resp.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Non-owner view: respond form */}
      {!isOwner && isLoggedIn && postStatus === "open" && (
        <>
          {hasResponded ? (
            <div className="rounded-xl border border-[var(--color-lime)]/20 bg-[var(--color-dark)] p-6 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-lime)]">
                Interest Sent
              </p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                The poster will see your response and can reach out to you.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                I&apos;m Interested
              </h3>
              <form onSubmit={handleRespond} className="mt-4 space-y-4">
                <textarea
                  placeholder="Tell them why you're a great fit..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] resize-none"
                />
                {error && (
                  <p className="font-[family-name:var(--font-mono)] text-xs text-red-400">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Interest"}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Not logged in */}
      {!isLoggedIn && postStatus === "open" && (
        <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 text-center">
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Sign in to express interest in this collaboration.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
