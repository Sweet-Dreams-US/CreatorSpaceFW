"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { submitToChallenge } from "@/app/actions/challenges";
import { useRouter } from "next/navigation";

export default function ChallengeSubmitForm({ challengeId }: { challengeId: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) {
    return (
      <div className="mt-6">
        <Link
          href="/auth/login"
          className="inline-flex rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
        >
          Sign in to Submit
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    const result = await submitToChallenge(challengeId, {
      title,
      description: description || undefined,
      link_url: linkUrl || undefined,
      media_url: mediaUrl || undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      setOpen(false);
      setSuccess(false);
      setTitle("");
      setDescription("");
      setLinkUrl("");
      setMediaUrl("");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="mt-6">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
        >
          Submit Your Work
        </button>
      ) : (
        <div className="rounded-xl border border-white/10 bg-[var(--color-dark)] p-6">
          {success ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <p className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)]">
                Submitted!
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
                Submit Your Work
              </h3>

              {error && (
                <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-red-400">
                  {error}
                </div>
              )}

              <div className="mt-5 flex flex-col gap-4">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Title *"
                  required
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  rows={3}
                  className="w-full resize-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="Link URL (portfolio, Behance, etc.)"
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="Media URL (optional image/video)"
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-white/10 py-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-white/20"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !title}
                  className="flex-1 rounded-full bg-[var(--color-coral)] py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,146,119,0.3)] disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
