"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { getPublicCreators } from "@/app/actions/creators";
import CommunityNav from "@/components/ui/CommunityNav";
import BadgeDisplay from "@/components/ui/BadgeDisplay";

const CATEGORIES = [
  "All",
  "Video",
  "Photo",
  "Editor",
  "VFX",
  "Code",
  "Music",
  "Aerial",
  "Design",
  "Writing",
  "Audio Engineering",
  "Animation",
  "Marketing",
  "Business",
];

const CATEGORY_COLORS: Record<string, string> = {
  All: "var(--color-white)",
  Video: "#d377fa",
  Photo: "#fa9277",
  Editor: "#f5c542",
  VFX: "#c577fa",
  Code: "#ffece1",
  Music: "#9dfa77",
  Aerial: "#77fac5",
  Design: "#77dffa",
  Writing: "#fa9277",
  "Audio Engineering": "#a3fa77",
  Animation: "#fa77b5",
  Marketing: "#fad677",
  Business: "#77b8fa",
};

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  skills: string;
  slug: string | null;
  avatar_url: string | null;
  badges: string[] | null;
}

export default function DirectoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const userIsAdmin = !authLoading && !!user && isAdmin(user.email);

  useEffect(() => {
    async function fetchCreators() {
      const data = await getPublicCreators();
      setCreators(data as Creator[]);
      setLoading(false);
    }
    fetchCreators();
  }, []);

  // Sort categories by popularity (number of creators with that skill)
  const sortedCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      if (cat === "All") continue;
      counts[cat] = 0;
    }
    for (const c of creators) {
      const skills = c.skills
        .split(",")
        .map((s) => s.trim().toLowerCase());
      for (const cat of CATEGORIES) {
        if (cat === "All") continue;
        if (skills.includes(cat.toLowerCase())) {
          counts[cat]++;
        }
      }
    }
    const rest = CATEGORIES.filter((c) => c !== "All").sort(
      (a, b) => counts[b] - counts[a]
    );
    return ["All", ...rest];
  }, [creators]);

  const filtered = creators.filter((c) => {
    const matchesFilter =
      filter === "All" ||
      c.skills.toLowerCase().includes(filter.toLowerCase());

    const matchesSearch =
      !search ||
      `${c.first_name} ${c.last_name} ${c.company || ""} ${c.job_title || ""} ${c.skills}`
        .toLowerCase()
        .includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Subtle gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #fa927720, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <CommunityNav />

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          THE DATABASE
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Every creator in the community.
        </p>

        {/* Search */}
        <div className="mt-8">
          <input
            type="text"
            placeholder="Search by name, company, skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] transition-colors focus:border-[var(--color-coral)]"
          />
        </div>

        {/* Filter pills */}
        <div className="mt-4 flex flex-wrap gap-2">
          {sortedCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all duration-200"
              style={
                filter === cat
                  ? {
                      backgroundColor: CATEGORY_COLORS[cat],
                      color: "var(--color-black)",
                    }
                  : {
                      backgroundColor: "var(--color-charcoal)",
                      color: "var(--color-mist)",
                    }
              }
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Join / Edit button */}
        <div className="mt-8">
          {!authLoading && user ? (
            <Link
              href="/profile/edit"
              className="inline-block rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740]"
            >
              Edit Your Profile
            </Link>
          ) : (
            <Link
              href="/auth/signup"
              className="inline-block rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740]"
            >
              Join the Database
            </Link>
          )}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Loading creators...
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              {creators.length === 0
                ? "No creators yet. Be the first to join."
                : "No creators match this filter."}
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((creator) => (
              <CreatorCard
                key={creator.id}
                creator={creator}
                showEdit={userIsAdmin}
              />
            ))}
          </div>
        )}
      </div>

    </main>
  );
}

function CreatorCard({
  creator,
  showEdit,
}: {
  creator: Creator;
  showEdit: boolean;
}) {
  const skillTags = creator.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const initials = `${creator.first_name?.[0] || ""}${creator.last_name?.[0] || ""}`.toUpperCase();

  const card = (
    <div className="group relative rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:scale-[1.02] hover:border-[var(--color-coral)] hover:shadow-[0_0_24px_rgba(250,146,119,0.12)]">
      {showEdit && (
        <Link
          href={`/profile/edit/${creator.id}`}
          onClick={(e) => e.stopPropagation()}
          className="absolute right-3 top-3 rounded-md border border-white/10 px-2 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
        >
          Edit
        </Link>
      )}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
          {creator.avatar_url ? (
            <img
              src={creator.avatar_url}
              alt={`${creator.first_name} ${creator.last_name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="font-[family-name:var(--font-display)] text-sm text-[var(--color-mist)]">
              {initials}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
            {creator.first_name} {creator.last_name}
          </p>
          {creator.company && (
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {creator.company}
              {creator.job_title ? ` · ${creator.job_title}` : ""}
            </p>
          )}
          {!creator.company && creator.job_title && (
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {creator.job_title}
            </p>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <div className="flex flex-wrap gap-1.5">
          {skillTags.map((tag, i) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--color-charcoal)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)] transition-all duration-300 group-hover:border-[var(--color-coral)]/20 group-hover:text-[var(--color-white)]"
              style={{
                transitionDelay: `${i * 50}ms`,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
        {creator.badges && creator.badges.length > 0 && (
          <div className="ml-auto flex-shrink-0">
            <BadgeDisplay badges={creator.badges} compact />
          </div>
        )}
      </div>
      {/* View Profile arrow - fades in on hover */}
      {creator.slug && (
        <div className="mt-3 flex justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)]">
            View Profile →
          </span>
        </div>
      )}
    </div>
  );

  if (creator.slug) {
    return (
      <Link href={`/directory/${creator.slug}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
