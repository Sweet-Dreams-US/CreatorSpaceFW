"use client";

import { useEffect, useState } from "react";
import {
  getAnalyticsOverview,
  getTrafficData,
  getTopProfiles,
  getRecentErrors,
  getConnectionActivity,
  getRecentSignups,
} from "@/app/actions/analytics";

interface OverviewData {
  viewsToday: number;
  viewsWeek: number;
  viewsMonth: number;
  totalViews: number;
  uniqueVisitors: number;
  activeUsers: number;
  topPages: { path: string; count: number }[];
}

interface TrafficDay {
  date: string;
  count: number;
  label: string;
}

interface ProfileView {
  creatorId: string;
  count: number;
  name: string;
  slug: string;
}

interface ErrorReport {
  id: string;
  page: string;
  error_message: string;
  user_agent: string | null;
  extra: Record<string, unknown> | null;
  created_at: string;
}

interface Connection {
  id: string;
  from: string;
  to: string;
  message: string | null;
  status: string;
  createdAt: string;
}

interface Signup {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  slug: string;
  created_at: string;
}

export default function AnalyticsPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [traffic, setTraffic] = useState<TrafficDay[]>([]);
  const [profiles, setProfiles] = useState<ProfileView[]>([]);
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedError, setExpandedError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [ov, tr, pr, er, cn, su] = await Promise.all([
          getAnalyticsOverview(),
          getTrafficData(14),
          getTopProfiles(10),
          getRecentErrors(20),
          getConnectionActivity(20),
          getRecentSignups(10),
        ]);
        setOverview(ov);
        setTraffic(tr);
        setProfiles(pr);
        setErrors(er);
        setConnections(cn);
        setSignups(su);
      } catch (e) {
        console.error("Failed to load analytics:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const maxTraffic = Math.max(...traffic.map((d) => d.count), 1);

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function statusColor(status: string) {
    switch (status) {
      case "accepted":
        return "text-[var(--color-lime)]";
      case "pending":
        return "text-[var(--color-sky)]";
      case "declined":
        return "text-[var(--color-coral)]";
      default:
        return "text-[var(--color-smoke)]";
    }
  }

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[var(--color-coral)] border-t-transparent" />
          Loading analytics...
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-8 overflow-x-hidden">
      {/* Header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
          ANALYTICS
        </h1>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Site traffic, user activity, and error tracking
        </p>
      </div>

      {/* Overview Stats Cards */}
      {overview && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Views Today"
            value={overview.viewsToday}
            accent="coral"
          />
          <StatCard
            label="Views This Week"
            value={overview.viewsWeek}
            accent="lime"
          />
          <StatCard
            label="Views This Month"
            value={overview.viewsMonth}
            accent="sky"
          />
          <StatCard
            label="Total Views"
            value={overview.totalViews}
            accent="violet"
          />
          <StatCard
            label="Unique Visitors (7d)"
            value={overview.uniqueVisitors}
            accent="lime"
          />
          <StatCard
            label="Active Users (24h)"
            value={overview.activeUsers}
            accent="sky"
          />
        </div>
      )}

      {/* Traffic Chart */}
      <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
          PAGE VIEWS — LAST 14 DAYS
        </h2>
        <div className="mt-6 flex items-end gap-1.5" style={{ height: 200 }}>
          {traffic.map((day) => {
            const height =
              day.count === 0 ? 2 : (day.count / maxTraffic) * 100;
            return (
              <div
                key={day.date}
                className="group relative flex flex-1 flex-col items-center"
              >
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-10 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-[var(--color-ash)] px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-white)] opacity-0 transition-opacity group-hover:opacity-100">
                  {day.count} views
                </div>
                {/* Bar */}
                <div
                  className="w-full rounded-t-sm bg-[var(--color-coral)] transition-all duration-300 group-hover:bg-[var(--color-coral)]/80"
                  style={{
                    height: `${height}%`,
                    minHeight: day.count === 0 ? "2px" : undefined,
                  }}
                />
                {/* Label */}
                <span className="mt-2 rotate-0 font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-smoke)] sm:rotate-0">
                  {day.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Top Pages Table */}
        {overview && overview.topPages.length > 0 && (
          <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              TOP PAGES
            </h2>
            <div className="mt-4 space-y-1">
              {overview.topPages.map((page, i) => (
                <div
                  key={page.path}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-ash)]/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {page.path}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-coral)]">
                    {page.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Profiles Table */}
        {profiles.length > 0 && (
          <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              TOP PROFILES
            </h2>
            <div className="mt-4 space-y-1">
              {profiles.map((profile, i) => (
                <div
                  key={profile.creatorId}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-ash)]/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/50">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {profile.name}
                    </span>
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-sm font-medium text-[var(--color-lime)]">
                    {profile.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Signups */}
        {signups.length > 0 && (
          <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              RECENT SIGNUPS
            </h2>
            <div className="mt-4 space-y-1">
              {signups.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-ash)]/30"
                >
                  <div>
                    <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {creator.first_name} {creator.last_name}
                    </span>
                    {creator.email && (
                      <span className="ml-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/60">
                        {creator.email}
                      </span>
                    )}
                  </div>
                  <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {timeAgo(creator.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Connection Activity */}
        {connections.length > 0 && (
          <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              CONNECTION ACTIVITY
            </h2>
            <div className="mt-4 space-y-1">
              {connections.map((conn) => (
                <div
                  key={conn.id}
                  className="rounded-lg px-3 py-2 transition-colors hover:bg-[var(--color-ash)]/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      <span className="text-[var(--color-white)]">
                        {conn.from}
                      </span>
                      <span className="mx-2 text-[var(--color-smoke)]/50">
                        →
                      </span>
                      <span className="text-[var(--color-white)]">
                        {conn.to}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-[family-name:var(--font-mono)] text-xs font-medium uppercase ${statusColor(conn.status)}`}
                      >
                        {conn.status}
                      </span>
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/60">
                        {timeAgo(conn.createdAt)}
                      </span>
                    </div>
                  </div>
                  {conn.message && (
                    <p className="mt-1 truncate font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/60">
                      &quot;{conn.message}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Log — Full Width */}
      <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
          ERROR LOG
        </h2>
        {errors.length === 0 ? (
          <p className="mt-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]/60">
            No errors reported yet.
          </p>
        ) : (
          <div className="mt-4 space-y-1">
            {errors.map((err) => (
              <div
                key={err.id}
                className="rounded-lg border border-transparent px-3 py-2 transition-colors hover:border-[var(--color-ash)] hover:bg-[var(--color-ash)]/20"
              >
                <button
                  onClick={() =>
                    setExpandedError(
                      expandedError === err.id ? null : err.id
                    )
                  }
                  className="flex w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)]">
                      ERR
                    </span>
                    <span className="truncate font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {err.error_message}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 pl-4">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/60">
                      {err.page}
                    </span>
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]/40">
                      {timeAgo(err.created_at)}
                    </span>
                    <span className="text-xs text-[var(--color-smoke)]/40">
                      {expandedError === err.id ? "▲" : "▼"}
                    </span>
                  </div>
                </button>

                {expandedError === err.id && (
                  <div className="mt-3 space-y-2 border-t border-[var(--color-ash)]/50 pt-3">
                    <div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]/50">
                        Page
                      </span>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {err.page}
                      </p>
                    </div>
                    <div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]/50">
                        Message
                      </span>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {err.error_message}
                      </p>
                    </div>
                    <div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]/50">
                        Timestamp
                      </span>
                      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {new Date(err.created_at).toLocaleString()}
                      </p>
                    </div>
                    {err.user_agent && (
                      <div>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]/50">
                          User Agent
                        </span>
                        <p className="break-all font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                          {err.user_agent}
                        </p>
                      </div>
                    )}
                    {err.extra && (
                      <div>
                        <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]/50">
                          Extra
                        </span>
                        <pre className="mt-1 max-h-40 overflow-auto rounded-md bg-[var(--color-black)] p-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                          {JSON.stringify(err.extra, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Empty state for no data */}
      {overview &&
        overview.totalViews === 0 &&
        profiles.length === 0 &&
        connections.length === 0 && (
          <div className="rounded-xl border border-dashed border-[var(--color-ash)] p-12 text-center">
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-smoke)]">
              NO DATA YET
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]/60">
              Analytics will appear here as users visit the site.
            </p>
          </div>
        )}
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "coral" | "lime" | "sky" | "violet";
}) {
  const colors = {
    coral: {
      border: "border-[var(--color-coral)]/20",
      bg: "bg-[var(--color-coral)]/5",
      text: "text-[var(--color-coral)]",
      glow: "shadow-[0_0_20px_rgba(250,146,119,0.05)]",
    },
    lime: {
      border: "border-[var(--color-lime)]/20",
      bg: "bg-[var(--color-lime)]/5",
      text: "text-[var(--color-lime)]",
      glow: "shadow-[0_0_20px_rgba(157,250,119,0.05)]",
    },
    sky: {
      border: "border-[var(--color-sky)]/20",
      bg: "bg-[var(--color-sky)]/5",
      text: "text-[var(--color-sky)]",
      glow: "shadow-[0_0_20px_rgba(119,223,250,0.05)]",
    },
    violet: {
      border: "border-[var(--color-violet)]/20",
      bg: "bg-[var(--color-violet)]/5",
      text: "text-[var(--color-violet)]",
      glow: "shadow-[0_0_20px_rgba(211,119,250,0.05)]",
    },
  };

  const c = colors[accent];

  return (
    <div
      className={`rounded-xl border ${c.border} ${c.bg} ${c.glow} p-5 transition-all duration-300 hover:scale-[1.02]`}
    >
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-[2px] text-[var(--color-smoke)]">
        {label}
      </p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] text-3xl ${c.text}`}
      >
        {value.toLocaleString()}
      </p>
    </div>
  );
}
