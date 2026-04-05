"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getLeaderboard,
  selectSpotlight,
  getCurrentSpotlight,
  getPastSpotlights,
} from "@/app/actions/points";

interface LeaderboardEntry {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  skills: string | null;
  points: number;
}

interface SpotlightData {
  id: string;
  month: number;
  year: number;
  featured_at: string;
  creators: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    slug: string | null;
    bio: string | null;
    skills: string | null;
    company: string | null;
    job_title: string | null;
  };
}

interface PastSpotlight {
  id: string;
  month: number;
  year: number;
  featured_at: string;
  creators: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    slug: string | null;
  };
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AdminSpotlightPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentSpotlight, setCurrentSpotlight] = useState<SpotlightData | null>(null);
  const [pastSpotlights, setPastSpotlights] = useState<PastSpotlight[]>([]);
  const [loading, setLoading] = useState(true);
  const [featuring, setFeaturing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [lb, spotlight, past] = await Promise.all([
      getLeaderboard(month, year),
      getCurrentSpotlight(),
      getPastSpotlights(),
    ]);
    setLeaderboard(lb as LeaderboardEntry[]);
    setCurrentSpotlight(spotlight as SpotlightData | null);
    setPastSpotlights(past as PastSpotlight[]);
    setLoading(false);
  }, [month, year]);

  useEffect(() => {
    load();
  }, [load]);

  const handleFeature = async (creatorId: string) => {
    setFeaturing(creatorId);
    const result = await selectSpotlight(creatorId, month, year);
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Spotlight updated successfully.");
      load();
    }
    setFeaturing(null);
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            SPOTLIGHT
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Feature a Creator of the Month based on leaderboard points
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            x
          </button>
        </div>
      )}

      {/* Current Spotlight Banner */}
      <div className="mt-6 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
          Current Spotlight
        </p>
        {currentSpotlight?.creators ? (
          <div className="mt-3 flex items-center gap-4">
            <div className="relative">
              {currentSpotlight.creators.avatar_url ? (
                <img
                  src={currentSpotlight.creators.avatar_url}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover ring-2 ring-[var(--color-coral)]"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-lg text-[var(--color-coral)] ring-2 ring-[var(--color-coral)]">
                  {(currentSpotlight.creators.first_name?.[0] || "")}
                  {(currentSpotlight.creators.last_name?.[0] || "")}
                </div>
              )}
              <span className="absolute -right-1 -top-1 text-lg">★</span>
            </div>
            <div>
              <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                {currentSpotlight.creators.first_name} {currentSpotlight.creators.last_name}
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                {currentSpotlight.creators.job_title && currentSpotlight.creators.company
                  ? `${currentSpotlight.creators.job_title} at ${currentSpotlight.creators.company}`
                  : currentSpotlight.creators.job_title || currentSpotlight.creators.company || "Creator"}
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                {MONTHS[currentSpotlight.month - 1]} {currentSpotlight.year}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
            No spotlight selected this month
          </p>
        )}
      </div>

      {/* Month/Year Selector */}
      <div className="mt-6 flex items-center gap-4">
        <div>
          <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
            Month
          </label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="ml-2 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
            Year
          </label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="ml-2 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
          >
            {[now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ash)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-ash)] bg-[var(--color-dark)]">
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Rank
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Creator
              </th>
              <th className="px-3 py-3 text-right font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Monthly Points
              </th>
              <th className="px-3 py-3 text-right font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  Loading...
                </td>
              </tr>
            ) : leaderboard.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  No points data for {MONTHS[month - 1]} {year}
                </td>
              </tr>
            ) : (
              leaderboard.map((entry, i) => (
                <tr
                  key={entry.id}
                  className="border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
                >
                  <td className="px-3 py-3">
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-[family-name:var(--font-mono)] text-xs font-semibold ${
                        i === 0
                          ? "bg-[var(--color-coral)]/20 text-[var(--color-coral)]"
                          : i === 1
                          ? "bg-[var(--color-violet)]/20 text-[var(--color-violet)]"
                          : i === 2
                          ? "bg-[var(--color-sky)]/20 text-[var(--color-sky)]"
                          : "text-[var(--color-smoke)]"
                      }`}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      {entry.avatar_url ? (
                        <img
                          src={entry.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-[10px] text-[var(--color-coral)]">
                          {(entry.first_name?.[0] || "")}{(entry.last_name?.[0] || "")}
                        </div>
                      )}
                      <div>
                        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                          {entry.first_name} {entry.last_name}
                        </p>
                        {entry.skills && (
                          <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                            {entry.skills.split(",").slice(0, 3).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-lime)]">
                    {entry.points}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleFeature(entry.id)}
                      disabled={featuring === entry.id}
                      className="rounded-full bg-[var(--color-coral)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
                    >
                      {featuring === entry.id ? "..." : "Feature"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Past Spotlights */}
      <div className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
          PAST SPOTLIGHTS
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {pastSpotlights.length === 0 ? (
            <p className="col-span-full font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              No past spotlights yet.
            </p>
          ) : (
            pastSpotlights.map((s) => (
              <div
                key={s.id}
                className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-4 transition-all hover:border-[var(--color-smoke)]"
              >
                <div className="flex items-center gap-3">
                  {s.creators?.avatar_url ? (
                    <img
                      src={s.creators.avatar_url}
                      alt=""
                      className="h-9 w-9 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-[10px] text-[var(--color-coral)]">
                      {(s.creators?.first_name?.[0] || "")}{(s.creators?.last_name?.[0] || "")}
                    </div>
                  )}
                  <div>
                    <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                      {s.creators?.first_name} {s.creators?.last_name}
                    </p>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {MONTHS[s.month - 1]} {s.year}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
