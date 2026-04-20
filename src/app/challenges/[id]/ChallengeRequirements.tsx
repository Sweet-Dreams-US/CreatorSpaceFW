"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getMyCompletions, checkAutoRequirements } from "@/app/actions/challenges";

interface Requirement {
  id: string;
  title: string;
  description: string | null;
  points: number;
  sort_order: number;
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (user) {
        // Run auto-check first to catch up on any completed actions
        try { await checkAutoRequirements(); } catch {}
        const myDone = await getMyCompletions(challengeId);
        setCompletedIds(myDone as string[]);
      }
      setLoading(false);
    }
    load();
  }, [user, challengeId]);

  if (requirements.length === 0) return null;

  const totalPoints = requirements.reduce((sum, r) => sum + r.points, 0);
  const earnedPoints = requirements
    .filter((r) => completedIds.includes(r.id))
    .reduce((sum, r) => sum + r.points, 0);

  return (
    <div className="mt-8">
      <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
            Requirements
          </h2>
          {user && (
            <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
              {earnedPoints}/{totalPoints} pts
            </span>
          )}
        </div>

        {/* Progress bar */}
        {user && (
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-ash)]">
            <div
              className="h-full rounded-full bg-[var(--color-lime)] transition-all duration-500"
              style={{ width: `${totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0}%` }}
            />
          </div>
        )}

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
                {/* Status indicator — NOT clickable */}
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                    done
                      ? "border-[var(--color-lime)] bg-[var(--color-lime)] text-[var(--color-black)]"
                      : "border-[var(--color-ash)]"
                  }`}
                >
                  {done && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {loading && !done && (
                    <div className="h-2 w-2 animate-pulse rounded-full bg-[var(--color-ash)]" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`font-[family-name:var(--font-mono)] text-sm ${done ? "text-[var(--color-lime)]" : "text-[var(--color-white)]"}`}>
                    {req.title}
                  </p>
                  {req.description && (
                    <p className="mt-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {req.description}
                    </p>
                  )}
                  {!done && !loading && user && (
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-smoke)] italic">
                      Auto-tracked — completes when you do the action
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
    </div>
  );
}
