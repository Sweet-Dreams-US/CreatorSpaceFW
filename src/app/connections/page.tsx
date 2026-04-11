"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CommunityNav from "@/components/ui/CommunityNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { getMyConnections, respondToConnection } from "@/app/actions/connections";

interface Creator {
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
  skills: string | null;
}

interface Connection {
  id: string;
  from_creator_id: string;
  to_creator_id: string;
  message: string | null;
  status: string;
  created_at: string;
  isSender: boolean;
  otherCreator: Creator | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function ConnectionsPage() {
  const { user, loading: authLoading } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all");
  const [responding, setResponding] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    async function load() {
      const result = await getMyConnections();
      setConnections((result.connections || []) as Connection[]);
      setLoading(false);
    }
    load();
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <CommunityNav />
          <div className="mt-24 text-center">
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">My Connections</h1>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              <Link href="/auth/login" className="text-[var(--color-coral)] hover:underline">Sign in</Link> to see your connections.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const pending = connections.filter((c) => c.status === "pending" && !c.isSender);
  const filtered = filter === "all"
    ? connections
    : filter === "pending"
    ? connections.filter((c) => c.status === "pending")
    : connections.filter((c) => c.status === "accepted");

  async function handleRespond(connectionId: string, decision: "accepted" | "declined") {
    setResponding(connectionId);
    await respondToConnection(connectionId, decision);
    setConnections((prev) =>
      prev.map((c) => c.id === connectionId ? { ...c, status: decision } : c)
    );
    setResponding(null);
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-16">
      <div className="pointer-events-none fixed inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, #d377fa20, transparent)" }} />

      <div className="relative z-10 mx-auto max-w-3xl">
        <CommunityNav />

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          CONNECTIONS
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Your network of creators
        </p>

        {/* Pending requests banner */}
        {pending.length > 0 && (
          <div className="mt-6 rounded-xl border border-[var(--color-coral)]/20 bg-[var(--color-coral)]/5 p-4">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-coral)]">
              You have {pending.length} pending connection request{pending.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Filter tabs */}
        <div className="mt-6 flex gap-2">
          {(["all", "pending", "accepted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all ${
                filter === f
                  ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                  : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
              }`}
            >
              {f === "all" ? `All (${connections.length})` : f === "pending" ? `Pending (${connections.filter(c => c.status === "pending").length})` : `Connected (${connections.filter(c => c.status === "accepted").length})`}
            </button>
          ))}
        </div>

        {/* Connection list */}
        <div className="mt-6 space-y-3">
          {loading ? (
            <p className="py-12 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Loading...</p>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
              <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                {filter === "all" ? "No connections yet. Visit creator profiles and connect!" : `No ${filter} connections.`}
              </p>
            </div>
          ) : (
            filtered.map((conn) => (
              <div
                key={conn.id}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                  conn.status === "pending" && !conn.isSender
                    ? "border-[var(--color-coral)]/20 bg-[var(--color-dark)]"
                    : "border-white/5 bg-[var(--color-dark)]"
                }`}
              >
                {/* Avatar */}
                <Link href={conn.otherCreator?.slug ? `/directory/${conn.otherCreator.slug}` : "#"}>
                  {conn.otherCreator?.avatar_url ? (
                    <Image
                      src={conn.otherCreator.avatar_url}
                      alt={`${conn.otherCreator.first_name} ${conn.otherCreator.last_name}`}
                      width={48}
                      height={48}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-ash)] font-[family-name:var(--font-display)] text-sm text-[var(--color-smoke)]">
                      {conn.otherCreator?.first_name?.[0]}{conn.otherCreator?.last_name?.[0]}
                    </div>
                  )}
                </Link>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <Link
                    href={conn.otherCreator?.slug ? `/directory/${conn.otherCreator.slug}` : "#"}
                    className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] hover:text-[var(--color-coral)]"
                  >
                    {conn.otherCreator ? `${conn.otherCreator.first_name} ${conn.otherCreator.last_name}` : "Unknown Creator"}
                  </Link>
                  {conn.otherCreator?.skills && (
                    <p className="truncate font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {conn.otherCreator.skills}
                    </p>
                  )}
                  {conn.message && conn.status === "pending" && (
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-xs italic text-[var(--color-mist)]">
                      &ldquo;{conn.message}&rdquo;
                    </p>
                  )}
                </div>

                {/* Status / Actions */}
                <div className="shrink-0">
                  {conn.status === "accepted" && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-lime)]/20 bg-[var(--color-lime)]/5 px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]">
                      Connected
                    </span>
                  )}
                  {conn.status === "pending" && conn.isSender && (
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      Sent {timeAgo(conn.created_at)}
                    </span>
                  )}
                  {conn.status === "pending" && !conn.isSender && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(conn.id, "accepted")}
                        disabled={responding === conn.id}
                        className="rounded-full bg-[var(--color-lime)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-black)] disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(conn.id, "declined")}
                        disabled={responding === conn.id}
                        className="rounded-full border border-[var(--color-ash)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                  {conn.status === "declined" && (
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      Declined
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
