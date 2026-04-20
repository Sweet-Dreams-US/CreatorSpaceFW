"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { completeRequirement, getMyCompletions, getChallengeLeaderboard } from "@/app/actions/challenges";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  points: number;
  sort_order: number;
}

interface LeaderboardEntry {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
  points: number;
  completed: number;
  total: number;
}

export default function ChallengeRequirements({
  challengeId,
  requirements,
}: {
  challengeId: string;
  requirements: Requirement[];
}) {
  const { user } = useAuth();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [completing, setCompleting] = useState<string | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [myDone, lb] = await Promise.all([
        user ? getMyCompletions(challengeId) : Promise.resolve([]),
        getChallengeLeaderboard(challengeId),
      ]);
      setCompletedIds(myDone as string[]);
      setLeaderboard(lb as LeaderboardEntry[]);
      setLoading(false);
    }
    load();
  }, [user, challengeId]);

  if (requirements.length === 0) return null;

  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0);
  const earnedPoints = requirements
    .filter((r) => completedIds.includes(r.id))
    .reduce((sum, r) => sum + r.points, 0);

  async function handleComplete(reqId: string) {
    setCompleting(reqId);
    const result = await completeRequirement(reqId);
    if (!result.error) {
      setCompletedIds((prev) => [...prev, reqId]);
      // Refresh leaderboard
      const lb = await getChallengeLeaderboard(challengeId);
      setLeaderboard(lb as LeaderboardEntry[]);
    }
    setCompleting(null);
  }

  return (
    <div className="mt-8 space-y-6">
      {/* Requirements checklist */}
      <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
            Requirements
          </h2>
          <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
            {earnedPoints}/{totalPoints} pts
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ash)]">
          <div
            className="h-full rounded-full bg-[var(--color-lime)] transition-all duration-500"
            style={{ width: `${totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0}%` }}
          />
        </div>

        <div className="mt-4 space-y-2">
          {requirements.map((req) => {
            const done = completedIds.includes(req.id);
            return (
              <div
                key={req.id}
                className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${
                  done
                    ? "border-[var(--color-lime)]/20 bg-[var(--color-lime)]/5"
                    : "border-white/5 bg-[var(--color-black)]"
                }`}
              >
                {user ? (
                  <button
                    onClick={() => !done && handleComplete(req.id)}
                    disabled={done || completing === req.id}
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all ${
                      done
                        ? "border-[var(--color-lime)] bg-[var(--color-lime)] text-[var(--color-black)]"
                        : "border-[var(--color-ash)] hover:border-[var(--color-coral)]"
                    }`}
                  >
                    {done && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                    {completing === req.id && (
                      <div className="h-3 w-3 animate-spin rounded-full border border-[var(--color-coral)] border-t-transparent" />
                    )}
                  </button>
                ) : (
                  <div className="mt-0.5 h-5 w-5 shrink-0 rounded border border-[var(--color-ash)]" />
                )}
                <div className="flex-1">
                  <p className={`font-[family-name:var(--font-mono)] text-sm ${done ? "text-[var(--color-lime)] line-through" : "text-[var(--color-white)]"}`}>
                    {req.title}
                  </p>
                  {req.description && (
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {req.description}
                    </p>
                  )}
                </div>
                <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]">
                  +{req.points} pts
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Per-challenge leaderboard */}
      {leaderboard.length > 0 && (
        <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
            Challenge Leaderboard
          </h2>
          <div className="mt-4 space-y-2">
            {leaderboard.map((entry, i) => (
              <div key={entry.id} className="flex items-center gap-3 py-1.5">
                <span className={`w-6 text-center font-[family-name:var(--font-display)] text-sm ${i === 0 ? "text-[var(--color-coral)]" : "text-[var(--color-smoke)]"}`}>
                  {i + 1}
                </span>
                <Link href={entry.slug ? `/directory/${entry.slug}` : "#"}>
                  {entry.avatar_url ? (
                    <Image src={entry.avatar_url} alt="" width={28} height={28} className="rounded-full object-cover" />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-ash)] font-[family-name:var(--font-display)] text-[10px] text-[var(--color-smoke)]">
                      {entry.first_name?.[0]}{entry.last_name?.[0]}
                    </div>
                  )}
                </Link>
                <Link href={entry.slug ? `/directory/${entry.slug}` : "#"} className="flex-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] hover:text-[var(--color-coral)]">
                  {entry.first_name} {entry.last_name}
                </Link>
                <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                  {entry.completed}/{entry.total}
                </span>
                <span className="font-[family-name:var(--font-display)] text-sm text-[var(--color-lime)]">
                  {entry.points}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
