"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CommunityNav from "@/components/ui/CommunityNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin, hasModeratorAccess } from "@/lib/admin";
import { getLeaderboard, getPointsBreakdown, getPointsGuide } from "@/app/actions/points";

interface LeaderboardEntry {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
  skills: string | null;
  points: number;
}

interface PointsGuideEntry {
  action: string;
  points: number;
  label: string;
}

interface PointsBreakdown {
  total: number;
  byAction: Record<string, { count: number; total: number }>;
  recent: { action_type: string; points: number; created_at: string }[];
}

const ACTION_LABELS: Record<string, string> = {
  profile_view_received: "Profile views",
  rsvp: "Event RSVPs",
  collab_post: "Collab posts",
  collab_response: "Collab responses",
  resource_listed: "Resources listed",
  connection_made: "Connections",
  challenge_submission: "Challenge submissions",
  profile_completeness: "Profile fields",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function LeaderboardPage() {
  const { user, loading: authLoading, role } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [myBreakdown, setMyBreakdown] = useState<PointsBreakdown | null>(null);
  const [guide, setGuide] = useState<PointsGuideEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    async function load() {
      const [lb, g] = await Promise.all([
        getLeaderboard(),
        getPointsGuide(),
      ]);
      setLeaderboard(lb);
      setGuide(g);
      setLoading(false);
    }
    load();
  }, []);

  // Load personal breakdown when user available
  useEffect(() => {
    if (!user) return;
    async function loadMy() {
      // Find creator ID for this user
      const { createClient } = await import("@/lib/supabase");
      const supabase = createClient();
      const { data: creator } = await supabase
        .from("creators")
        .select("id")
        .eq("auth_id", user!.id)
        .single();
      if (creator) {
        const breakdown = await getPointsBreakdown(creator.id);
        setMyBreakdown(breakdown);
      }
    }
    loadMy();
  }, [user]);

  // Admin/board only — redirect others
  const canView = !authLoading && !!user && (isAdmin(user.email) || hasModeratorAccess(role));
  const displayList = leaderboard;

  if (loading || authLoading) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <div className="mt-24 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Loading...
          </div>
        </div>
      </main>
    );
  }

  if (!canView) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="mt-24 font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
            Admin Only
          </h1>
          <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            The leaderboard is currently only available to admins.
          </p>
          <Link
            href="/directory"
            className="mt-8 inline-block rounded-full border border-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
          >
            Back to Directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-16">
      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #9dfa7720, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <CommunityNav />

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          LEADERBOARD
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Earn points by being active in the community
        </p>

        {/* How to Earn toggle */}
        <button
          onClick={() => setShowGuide(!showGuide)}
          className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] underline decoration-dotted underline-offset-4 transition-colors hover:text-[var(--color-white)]"
        >
          {showGuide ? "Hide" : "How do I earn points?"}
        </button>

        {showGuide && (
          <div className="mt-4 rounded-xl border border-white/5 bg-[var(--color-dark)] p-5">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              Earning Points
            </h3>
            <div className="mt-4 space-y-2">
              {guide.map((g) => (
                <div
                  key={g.action}
                  className="flex items-center justify-between border-b border-white/5 py-2 last:border-0"
                >
                  <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                    {g.label}
                  </span>
                  <span className="font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-lime)]">
                    +{g.points} pts
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* My Points Breakdown (logged in only) */}
        {isLoggedIn && myBreakdown && (
          <div className="mt-8 rounded-xl border border-[var(--color-coral)]/20 bg-[var(--color-dark)] p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                Your Points
              </h2>
              <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-coral)]">
                {myBreakdown.total}
              </span>
            </div>

            {/* Breakdown by action */}
            {Object.keys(myBreakdown.byAction).length > 0 && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {Object.entries(myBreakdown.byAction)
                  .sort(([, a], [, b]) => b.total - a.total)
                  .map(([action, data]) => (
                    <div
                      key={action}
                      className="rounded-lg border border-white/5 bg-[var(--color-black)] px-3 py-2"
                    >
                      <div className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        {ACTION_LABELS[action] || action}
                      </div>
                      <div className="mt-1 flex items-baseline gap-2">
                        <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-lime)]">
                          {data.total}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                          ({data.count}x)
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Recent activity */}
            {myBreakdown.recent.length > 0 && (
              <div className="mt-4">
                <h3 className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                  Recent Activity
                </h3>
                <div className="mt-2 space-y-1">
                  {myBreakdown.recent.slice(0, 8).map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-1"
                    >
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {ACTION_LABELS[r.action_type] || r.action_type}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                          +{r.points}
                        </span>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                          {timeAgo(r.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Leaderboard Rankings */}
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            Community Rankings
          </h2>

          <div className="mt-6 space-y-3">
            {displayList.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all duration-200 ${
                  i === 0
                    ? "border-[var(--color-coral)]/30 bg-[var(--color-dark)] shadow-[0_0_24px_rgba(250,146,119,0.08)]"
                    : i === 1
                    ? "border-white/10 bg-[var(--color-dark)]"
                    : i === 2
                    ? "border-white/5 bg-[var(--color-dark)]"
                    : "border-white/5 bg-[var(--color-dark)]/50"
                }`}
              >
                {/* Rank */}
                <div className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {i < 3 ? (
                    <span
                      className={`font-[family-name:var(--font-display)] text-lg ${
                        i === 0
                          ? "text-[var(--color-coral)]"
                          : i === 1
                          ? "text-[var(--color-mist)]"
                          : "text-[var(--color-smoke)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  ) : (
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {i + 1}
                    </span>
                  )}
                </div>

                {/* Avatar */}
                <Link href={entry.slug ? `/directory/${entry.slug}` : "#"}>
                  {entry.avatar_url ? (
                    <Image
                      src={entry.avatar_url}
                      alt={`${entry.first_name} ${entry.last_name}`}
                      width={40}
                      height={40}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-ash)] font-[family-name:var(--font-display)] text-sm text-[var(--color-smoke)]">
                      {entry.first_name?.[0]}
                      {entry.last_name?.[0]}
                    </div>
                  )}
                </Link>

                {/* Name + skills */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={entry.slug ? `/directory/${entry.slug}` : "#"}
                    className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] hover:text-[var(--color-coral)]"
                  >
                    {entry.first_name} {entry.last_name}
                  </Link>
                  {entry.skills && (
                    <p className="truncate font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {entry.skills}
                    </p>
                  )}
                </div>

                {/* Points */}
                <div className="shrink-0 text-right">
                  <span className="font-[family-name:var(--font-display)] text-lg text-[var(--color-lime)]">
                    {entry.points}
                  </span>
                  <span className="ml-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                    pts
                  </span>
                </div>
              </div>
            ))}

            {displayList.length === 0 && (
              <p className="py-12 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                No points earned yet. Be the first!
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
