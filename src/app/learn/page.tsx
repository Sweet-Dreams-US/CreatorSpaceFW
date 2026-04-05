"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/providers/AuthProvider";
import { getAvailableExchanges, getSkillExchangeMatches } from "@/app/actions/learn";
import { sendConnectionRequest } from "@/app/actions/connections";

const SKILL_CATEGORIES = [
  "All",
  "Video",
  "Photo",
  "Editor",
  "Music",
  "Design",
  "Writing",
  "Dev",
  "Marketing",
  "Animation",
  "Podcast",
  "Art",
  "Fashion",
  "Dance",
  "Film",
];

interface Exchange {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
  skills: string | null;
  can_teach: string[];
  wants_to_learn: string[];
}

interface Match extends Exchange {
  teachMatch: string[];
  learnMatch: string[];
  score: number;
}

export default function LearnPage() {
  const { user } = useAuth();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [filter, setFilter] = useState("All");
  const [loading, setLoading] = useState(true);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const [connectedIds, setConnectedIds] = useState<Set<string>>(new Set());

  const loadData = useCallback(async () => {
    const [allExchanges, userMatches] = await Promise.all([
      getAvailableExchanges(),
      user ? getSkillExchangeMatches() : Promise.resolve([]),
    ]);
    setExchanges(allExchanges as Exchange[]);
    setMatches(userMatches as Match[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = filter === "All"
    ? exchanges
    : exchanges.filter(
        (e) =>
          e.can_teach?.includes(filter) || e.wants_to_learn?.includes(filter)
      );

  async function handleConnect(creatorId: string) {
    setConnectingId(creatorId);
    const result = await sendConnectionRequest(creatorId);
    setConnectingId(null);
    if (result.success) {
      setConnectedIds((prev) => new Set(prev).add(creatorId));
    }
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
          SKILLS EXCHANGE
        </h1>
        <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Teach what you know, learn what you don&apos;t. Connect with creators who complement your skillset.
        </p>

        {/* Your Matches (logged in only) */}
        {user && matches.length > 0 && (
          <section className="mt-12">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
              Your Matches
            </h2>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Creators who can teach you or want to learn from you
            </p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-xl border border-[var(--color-coral)]/20 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  {/* Creator */}
                  <div className="flex items-center gap-3">
                    <Link href={match.slug ? `/directory/${match.slug}` : "#"}>
                      {match.avatar_url ? (
                        <Image
                          src={match.avatar_url}
                          alt={`${match.first_name} ${match.last_name}`}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-xs text-[var(--color-smoke)]">
                          {match.first_name?.[0]}
                          {match.last_name?.[0]}
                        </div>
                      )}
                    </Link>
                    <Link
                      href={match.slug ? `/directory/${match.slug}` : "#"}
                      className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-colors hover:text-[var(--color-coral)]"
                    >
                      {match.first_name} {match.last_name}
                    </Link>
                  </div>

                  {/* What they can teach you */}
                  {match.teachMatch.length > 0 && (
                    <div className="mt-4">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        Can teach you
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {match.teachMatch.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[var(--color-lime)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* What they want to learn from you */}
                  {match.learnMatch.length > 0 && (
                    <div className="mt-3">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        Wants to learn from you
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {match.learnMatch.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[var(--color-sky)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connect */}
                  <div className="mt-4">
                    {connectedIds.has(match.id) ? (
                      <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(match.id)}
                        disabled={connectingId === match.id}
                        className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
                      >
                        {connectingId === match.id ? "Sending..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Edit profile link */}
        {user && (
          <div className="mt-8">
            <Link
              href="/profile/edit"
              className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-colors hover:text-[var(--color-white)]"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit your teach/learn skills in your profile
            </Link>
          </div>
        )}

        {/* Browse All */}
        <section className={user && matches.length > 0 ? "mt-16" : "mt-12"}>
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            Browse All
          </h2>

          {/* Filter */}
          <div className="mt-5 flex flex-wrap gap-2">
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all ${
                  filter === cat
                    ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                    : "border border-white/10 text-[var(--color-smoke)] hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((creator) => (
                <div
                  key={creator.id}
                  className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  {/* Creator info */}
                  <div className="flex items-center gap-3">
                    <Link href={creator.slug ? `/directory/${creator.slug}` : "#"}>
                      {creator.avatar_url ? (
                        <Image
                          src={creator.avatar_url}
                          alt={`${creator.first_name} ${creator.last_name}`}
                          width={36}
                          height={36}
                          className="h-9 w-9 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-xs text-[var(--color-smoke)]">
                          {creator.first_name?.[0]}
                          {creator.last_name?.[0]}
                        </div>
                      )}
                    </Link>
                    <Link
                      href={creator.slug ? `/directory/${creator.slug}` : "#"}
                      className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-colors hover:text-[var(--color-coral)]"
                    >
                      {creator.first_name} {creator.last_name}
                    </Link>
                  </div>

                  {/* Can Teach */}
                  {creator.can_teach && creator.can_teach.length > 0 && (
                    <div className="mt-4">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        Can Teach
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {creator.can_teach.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[var(--color-lime)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Wants to Learn */}
                  {creator.wants_to_learn && creator.wants_to_learn.length > 0 && (
                    <div className="mt-3">
                      <span className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        Wants to Learn
                      </span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {creator.wants_to_learn.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-[var(--color-sky)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Connect button */}
                  <div className="mt-4">
                    {!user ? (
                      <Link
                        href="/auth/login"
                        className="inline-flex rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
                      >
                        Sign in to Connect
                      </Link>
                    ) : connectedIds.has(creator.id) ? (
                      <span className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        Request Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => handleConnect(creator.id)}
                        disabled={connectingId === creator.id}
                        className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
                      >
                        {connectingId === creator.id ? "Sending..." : "Connect"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
              <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                No creators found for &quot;{filter}&quot;. Try a different filter.
              </p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
