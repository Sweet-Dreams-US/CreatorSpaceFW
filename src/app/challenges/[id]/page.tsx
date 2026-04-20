import Link from "next/link";
import Image from "next/image";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { getChallengeWithSubmissions, getSubmissionCount, getAcceptanceCount, getChallengeRequirements } from "@/app/actions/challenges";
import ChallengeRequirements from "./ChallengeRequirements";
import ChallengeSubmitForm from "./ChallengeSubmitForm";
import ChallengeAcceptButton from "./ChallengeAcceptButton";

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

function deadlineStatus(deadline: string | null): { label: string; color: string } {
  if (!deadline) return { label: "Open", color: "var(--color-lime)" };
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return { label: "Deadline Passed", color: "var(--color-smoke)" };
  const days = Math.floor(diff / 86400000);
  if (days < 3) return { label: `${days}d ${Math.floor((diff % 86400000) / 3600000)}h left`, color: "var(--color-coral)" };
  return { label: `${days} days left`, color: "var(--color-lime)" };
}

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const challenge = await getChallengeWithSubmissions(id);

  if (!challenge) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/challenges"
            className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to challenges
          </Link>
          <div className="mt-12 rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Challenge not found.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const [count, acceptCount, requirements] = await Promise.all([
    getSubmissionCount(id),
    getAcceptanceCount(id),
    getChallengeRequirements(id),
  ]);
  const deadline = deadlineStatus(challenge.submission_deadline);
  const isActive = challenge.status === "active";
  const canSubmit = isActive && (
    !challenge.submission_deadline || new Date(challenge.submission_deadline).getTime() > Date.now()
  );

  // Check if current user has submitted — only show others' submissions if they have
  let userHasSubmitted = false;
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: creator } = await getSupabaseAdmin()
        .from("creators")
        .select("id")
        .eq("auth_id", user.id)
        .single();
      if (creator) {
        const { data: submission } = await getSupabaseAdmin()
          .from("challenge_submissions")
          .select("id")
          .eq("challenge_id", id)
          .eq("creator_id", creator.id)
          .limit(1)
          .single();
        userHasSubmitted = !!submission;
      }
    }
  } catch { /* not logged in */ }

  // For completed challenges, always show submissions
  const showSubmissions = !isActive || userHasSubmitted;

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/challenges"
          className="mb-10 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to challenges
        </Link>

        {/* Challenge Header */}
        <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase tracking-wider"
              style={{
                color: isActive ? "var(--color-lime)" : "var(--color-smoke)",
                backgroundColor: isActive ? "rgba(157,250,119,0.1)" : "rgba(136,136,136,0.1)",
              }}
            >
              {isActive && <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-lime)] animate-pulse" />}
              {isActive ? "Active" : "Completed"}
            </span>
            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {MONTH_NAMES[challenge.month - 1]} {challenge.year}
            </span>
            {challenge.submission_deadline && (
              <span
                className="font-[family-name:var(--font-mono)] text-xs"
                style={{ color: deadline.color }}
              >
                {deadline.label}
              </span>
            )}
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)] sm:text-4xl">
            {challenge.title}
          </h1>

          {challenge.description && (
            <p className="mt-4 max-w-3xl font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-smoke)]">
              {challenge.description}
            </p>
          )}

          {/* Timeline */}
          {(challenge.starts_at || challenge.ends_at) && (
            <div className="mt-5 flex flex-wrap gap-4">
              {challenge.starts_at && (
                <div className="rounded-lg border border-white/5 bg-[var(--color-black)] px-3 py-2">
                  <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                    Starts
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                    {new Date(challenge.starts_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              )}
              {challenge.ends_at && (
                <div className="rounded-lg border border-white/5 bg-[var(--color-black)] px-3 py-2">
                  <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                    Ends
                  </div>
                  <div className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                    {new Date(challenge.ends_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Social tags (respects show_hashtag / show_instagram toggles) */}
          {((challenge.hashtag && challenge.show_hashtag !== false) || (challenge.instagram_handle && challenge.show_instagram !== false)) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {challenge.hashtag && challenge.show_hashtag !== false && (
                <span className="rounded-full bg-[var(--color-violet)]/10 px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-violet)]">
                  {challenge.hashtag}
                </span>
              )}
              {challenge.instagram_handle && challenge.show_instagram !== false && (
                <a
                  href={`https://instagram.com/${challenge.instagram_handle.replace("@", "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-[var(--color-coral)]/10 px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-colors hover:bg-[var(--color-coral)]/20"
                >
                  {challenge.instagram_handle}
                </a>
              )}
            </div>
          )}

          <div className="mt-5 flex items-center gap-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
            <span>{count} submission{count !== 1 ? "s" : ""}</span>
            <span>{acceptCount} accepted</span>
          </div>
        </div>

        {/* Rules */}
        {challenge.rules && (
          <div className="mt-6 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              Rules & Requirements
            </h2>
            <div className="mt-3 whitespace-pre-line font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
              {challenge.rules}
            </div>
          </div>
        )}

        {/* Trackable Requirements */}
        {requirements.length > 0 && (
          <ChallengeRequirements challengeId={id} requirements={requirements} />
        )}

        {/* Accept + Submit */}
        {isActive && (
          <ChallengeAcceptButton challengeId={id} canSubmit={canSubmit} hasRequirements={requirements.length > 0} />
        )}

        {/* Submissions Gallery — only visible after user submits their own (or challenge is completed) */}
        {!showSubmissions && challenge.submissions && challenge.submissions.length > 0 && (
          <div className="mt-10 rounded-xl border border-white/5 bg-[var(--color-dark)] p-8 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Submit your work first to see what others have created.
            </p>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {challenge.submissions.length} submission{challenge.submissions.length !== 1 ? "s" : ""} so far
            </p>
          </div>
        )}
        {showSubmissions && challenge.submissions && challenge.submissions.length > 0 && (
          <section className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
              Submissions
            </h2>
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {challenge.submissions.map((sub: {
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
              }) => (
                <div
                  key={sub.id}
                  className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  {/* Creator */}
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

                  {/* Content */}
                  <h3 className="mt-4 font-[family-name:var(--font-display)] text-sm text-[var(--color-white)]">
                    {sub.title}
                  </h3>
                  {sub.description && (
                    <p className="mt-2 line-clamp-3 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--color-smoke)]">
                      {sub.description}
                    </p>
                  )}

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
          </section>
        )}

        {challenge.submissions && challenge.submissions.length === 0 && (
          <div className="mt-10 rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              No submissions yet. Be the first!
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
