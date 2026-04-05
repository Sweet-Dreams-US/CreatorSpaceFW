"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  getCurrentChallenge,
  getPastChallenges,
  getChallengeWithSubmissions,
  submitToChallenge,
  getSubmissionCount,
} from "@/app/actions/challenges";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  month: number;
  year: number;
  status: string;
  submission_deadline: string | null;
  created_at: string;
}

interface Submission {
  id: string;
  title: string;
  description: string | null;
  media_url: string | null;
  link_url: string | null;
  created_at: string;
  creators: {
    id: string;
    first_name: string;
    last_name: string;
    avatar_url: string | null;
    slug: string | null;
  };
}

interface ChallengeWithSubmissions extends Challenge {
  submissions: Submission[];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function useCountdown(deadline: string | null) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, expired: true });

  useEffect(() => {
    if (!deadline) return;

    function calc() {
      const now = Date.now();
      const end = new Date(deadline!).getTime();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, mins: 0, expired: true });
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        expired: false,
      });
    }

    calc();
    const interval = setInterval(calc, 60000);
    return () => clearInterval(interval);
  }, [deadline]);

  return timeLeft;
}

export default function ChallengesPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState<ChallengeWithSubmissions | null>(null);
  const [past, setPast] = useState<Challenge[]>([]);
  const [pastCounts, setPastCounts] = useState<Record<string, number>>({});
  const [submissionCount, setSubmissionCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  const [formTitle, setFormTitle] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formLink, setFormLink] = useState("");
  const [formMedia, setFormMedia] = useState("");

  const countdown = useCountdown(current?.submission_deadline ?? null);

  const loadData = useCallback(async () => {
    const [currentChallenge, pastChallenges] = await Promise.all([
      getCurrentChallenge(),
      getPastChallenges(),
    ]);

    if (currentChallenge) {
      const withSubs = await getChallengeWithSubmissions(currentChallenge.id);
      setCurrent(withSubs as ChallengeWithSubmissions | null);
      const count = await getSubmissionCount(currentChallenge.id);
      setSubmissionCount(count);
    }

    setPast(pastChallenges as Challenge[]);

    // Fetch counts for past challenges
    const counts: Record<string, number> = {};
    await Promise.all(
      (pastChallenges as Challenge[]).map(async (c) => {
        counts[c.id] = await getSubmissionCount(c.id);
      })
    );
    setPastCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!showModal) return;
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!current) return;
    setSubmitting(true);
    setSubmitError("");

    const result = await submitToChallenge(current.id, {
      title: formTitle,
      description: formDesc || undefined,
      link_url: formLink || undefined,
      media_url: formMedia || undefined,
    });

    setSubmitting(false);

    if (result.error) {
      setSubmitError(result.error);
      return;
    }

    setSubmitSuccess(true);
    setFormTitle("");
    setFormDesc("");
    setFormLink("");
    setFormMedia("");
    setTimeout(() => {
      setShowModal(false);
      setSubmitSuccess(false);
      loadData();
    }, 1500);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-center py-32">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-coral)] border-t-transparent" />
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to home
        </Link>

        {/* Header */}
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--color-white)] sm:text-5xl">
          MONTHLY CHALLENGE
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Push your creative limits. Submit your best work. Get seen.
        </p>

        {/* Current Challenge */}
        {current ? (
          <section className="mt-12">
            <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 transition-all duration-300 hover:border-[var(--color-coral)] sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-lime)]/10 px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-wider text-[var(--color-lime)]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)] animate-pulse" />
                      Active
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {MONTH_NAMES[current.month - 1]} {current.year}
                    </span>
                  </div>
                  <h2 className="mt-3 font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)] sm:text-3xl">
                    {current.title}
                  </h2>
                  {current.description && (
                    <p className="mt-3 max-w-2xl font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-smoke)]">
                      {current.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-4">
                  {/* Countdown */}
                  {current.submission_deadline && !countdown.expired && (
                    <div className="flex gap-3">
                      {[
                        { val: countdown.days, label: "DAYS" },
                        { val: countdown.hours, label: "HRS" },
                        { val: countdown.mins, label: "MIN" },
                      ].map((item) => (
                        <div key={item.label} className="flex flex-col items-center rounded-lg border border-white/5 bg-[var(--color-charcoal)] px-3 py-2">
                          <span className="font-[family-name:var(--font-display)] text-xl text-[var(--color-coral)]">
                            {String(item.val).padStart(2, "0")}
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-[9px] tracking-widest text-[var(--color-smoke)]">
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {countdown.expired && current.submission_deadline && (
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)]">
                      Deadline passed
                    </span>
                  )}

                  {/* Submission count */}
                  <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {submissionCount} submission{submissionCount !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <div className="mt-6 border-t border-white/5 pt-6">
                {user ? (
                  <button
                    onClick={() => setShowModal(true)}
                    disabled={countdown.expired && !!current.submission_deadline}
                    className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Submit Your Work
                  </button>
                ) : (
                  <Link
                    href="/auth/login"
                    className="inline-flex rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
                  >
                    Sign in to Submit
                  </Link>
                )}
              </div>
            </div>

            {/* Submissions Gallery */}
            {current.submissions && current.submissions.length > 0 && (
              <div className="mt-10">
                <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
                  Submissions
                </h3>
                <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {current.submissions.map((sub) => (
                    <div
                      key={sub.id}
                      className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]"
                    >
                      {/* Creator info */}
                      <div className="flex items-center gap-3">
                        <Link href={sub.creators.slug ? `/directory/${sub.creators.slug}` : "#"}>
                          {sub.creators.avatar_url ? (
                            <Image
                              src={sub.creators.avatar_url}
                              alt={`${sub.creators.first_name} ${sub.creators.last_name}`}
                              width={32}
                              height={32}
                              className="h-8 w-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-xs text-[var(--color-smoke)]">
                              {sub.creators.first_name?.[0]}
                              {sub.creators.last_name?.[0]}
                            </div>
                          )}
                        </Link>
                        <Link
                          href={sub.creators.slug ? `/directory/${sub.creators.slug}` : "#"}
                          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-colors hover:text-[var(--color-coral)]"
                        >
                          {sub.creators.first_name} {sub.creators.last_name}
                        </Link>
                        <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                          {relativeTime(sub.created_at)}
                        </span>
                      </div>

                      {/* Submission content */}
                      <h4 className="mt-4 font-[family-name:var(--font-display)] text-sm text-[var(--color-white)]">
                        {sub.title}
                      </h4>
                      {sub.description && (
                        <p className="mt-2 line-clamp-3 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--color-smoke)]">
                          {sub.description}
                        </p>
                      )}

                      {/* Link */}
                      {sub.link_url && (
                        <a
                          href={sub.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-coral)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
                        >
                          View Work
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7" />
                            <path d="M7 7h10v10" />
                          </svg>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        ) : (
          <div className="mt-12 rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              No active challenge right now. Check back soon.
            </p>
          </div>
        )}

        {/* Past Challenges */}
        {past.length > 0 && (
          <section className="mt-16">
            <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
              Past Challenges
            </h3>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((c) => (
                <Link
                  key={c.id}
                  href={`/challenges/${c.id}`}
                  className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {MONTH_NAMES[c.month - 1]} {c.year}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      Completed
                    </span>
                  </div>
                  <h4 className="mt-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-white)] transition-colors group-hover:text-[var(--color-coral)]">
                    {c.title}
                  </h4>
                  <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {pastCounts[c.id] || 0} submission{(pastCounts[c.id] || 0) !== 1 ? "s" : ""}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Submit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="mx-4 w-full max-w-md rounded-xl border border-white/10 bg-[var(--color-dark)] p-6 shadow-2xl"
          >
            {submitSuccess ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
                  Submitted!
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
                  Submit Your Work
                </h3>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                  Share your challenge entry with the community.
                </p>

                {submitError && (
                  <div className="mt-4 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-red-400">
                    {submitError}
                  </div>
                )}

                <div className="mt-5 flex flex-col gap-4">
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Title *"
                    required
                    className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  />
                  <textarea
                    value={formDesc}
                    onChange={(e) => setFormDesc(e.target.value)}
                    placeholder="Description"
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  />
                  <input
                    type="url"
                    value={formLink}
                    onChange={(e) => setFormLink(e.target.value)}
                    placeholder="Link URL (portfolio, Behance, etc.)"
                    className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  />
                  <input
                    type="url"
                    value={formMedia}
                    onChange={(e) => setFormMedia(e.target.value)}
                    placeholder="Media URL (optional image/video)"
                    className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 rounded-full border border-white/10 py-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !formTitle}
                    className="flex-1 rounded-full bg-[var(--color-coral)] py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,146,119,0.3)] disabled:opacity-50"
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
