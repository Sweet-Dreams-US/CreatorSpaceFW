"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import CommunityNav from "@/components/ui/CommunityNav";
import { useAuth } from "@/components/providers/AuthProvider";
import {
  createCollabPost,
  getCollabPosts,
  getResponseCountsBatch,
  getMyCollabPosts,
} from "@/app/actions/collaborate";

const SKILL_CATEGORIES = [
  "Video",
  "Photo",
  "Editor",
  "Music",
  "Design",
  "Writing",
  "Developer",
  "Aerial/Drone",
  "Marketing",
  "Animation",
  "Podcast",
  "Art",
  "Fashion",
  "Dance",
  "Film",
  "Other",
];

const TYPE_OPTIONS = ["All", "Looking For", "Offering"] as const;
const STATUS_OPTIONS = ["Open", "All"] as const;

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
}

interface CollabPost {
  id: string;
  creator_id: string;
  type: "looking_for" | "offering";
  title: string;
  description: string | null;
  category: string | null;
  budget: string | null;
  deadline: string | null;
  team_size: number | null;
  positions: string | null;
  scope: string | null;
  status: string;
  created_at: string;
  creators: Creator;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function CollaboratePage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [responseCounts, setResponseCounts] = useState<Record<string, number>>(
    {}
  );
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("Open");
  const [showModal, setShowModal] = useState(false);
  const [myPosts, setMyPosts] = useState<CollabPost[]>([]);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [formType, setFormType] = useState<"looking_for" | "offering">(
    "looking_for"
  );
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategories, setFormCategories] = useState<string[]>([]);
  const [formCustomCategory, setFormCustomCategory] = useState("");
  const [formBudget, setFormBudget] = useState("");
  const [formTeamSize, setFormTeamSize] = useState("");
  const [formPositions, setFormPositions] = useState("");
  const [formScope, setFormScope] = useState("");
  const [formDeadline, setFormDeadline] = useState("");

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const filters: { type?: string; category?: string; status?: string } = {};
    if (typeFilter === "Looking For") filters.type = "looking_for";
    if (typeFilter === "Offering") filters.type = "offering";
    if (categoryFilter) filters.category = categoryFilter;
    if (statusFilter === "All") filters.status = "";
    // Default is "open" in the server action when status not specified
    const data = await getCollabPosts(
      statusFilter === "All" ? { ...filters, status: "all" } : filters
    );
    setPosts(data as CollabPost[]);

    // Fetch response counts (batch)
    const postIds = (data as CollabPost[]).map((p) => p.id);
    const counts = await getResponseCountsBatch(postIds);
    setResponseCounts(counts);

    // Fetch user's own posts (including filled/closed)
    if (user) {
      const mine = await getMyCollabPosts();
      setMyPosts(mine as CollabPost[]);
    }

    setLoading(false);
  }, [typeFilter, categoryFilter, statusFilter]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function handleCreatePost(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const result = await createCollabPost({
      type: formType,
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategories.length > 0
        ? (formCategories.includes("Other") ? [...formCategories.filter(c => c !== "Other"), formCustomCategory || "Other"].join(", ") : formCategories.join(", "))
        : undefined,
      budget: formBudget.trim() || undefined,
      deadline: formDeadline || undefined,
      team_size: formTeamSize ? parseInt(formTeamSize) : undefined,
      positions: formPositions.trim() || undefined,
      scope: formScope.trim() || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    // Reset and close
    setFormTitle("");
    setFormDescription("");
    setFormCategories([]);
    setFormBudget("");
    setFormDeadline("");
    setFormTeamSize("");
    setFormPositions("");
    setFormScope("");
    setFormType("looking_for");
    setShowModal(false);
    fetchPosts();
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Subtle gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #d377fa20, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        <CommunityNav />

        {/* Header */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          COLLABORATE
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Find collaborators or offer your skills
        </p>

        {/* Post CTA */}
        <div className="mt-6">
          {!authLoading && user ? (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:shadow-[0_0_24px_rgba(250,146,119,0.4)]"
            >
              + Post a Collab Request
            </button>
          ) : (
            !authLoading && (
              <Link
                href="/auth/login"
                className="inline-block rounded-full border border-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
              >
                Sign in to post a collab request
              </Link>
            )
          )}
        </div>

        {/* Filter bar */}
        <div className="mt-8 space-y-4">
          {/* Type toggle */}
          <div className="flex flex-wrap items-center gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setTypeFilter(opt)}
                className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all duration-200"
                style={
                  typeFilter === opt
                    ? {
                        backgroundColor: "var(--color-coral)",
                        color: "var(--color-black)",
                      }
                    : {
                        backgroundColor: "var(--color-charcoal)",
                        color: "var(--color-mist)",
                      }
                }
              >
                {opt}
              </button>
            ))}

            <div className="mx-2 h-4 w-px bg-[var(--color-ash)]" />

            {/* Status toggle */}
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setStatusFilter(opt)}
                className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all duration-200"
                style={
                  statusFilter === opt
                    ? {
                        backgroundColor: "var(--color-lime)",
                        color: "var(--color-black)",
                      }
                    : {
                        backgroundColor: "var(--color-charcoal)",
                        color: "var(--color-mist)",
                      }
                }
              >
                {opt}
              </button>
            ))}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCategoryFilter("")}
              className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all duration-200"
              style={
                categoryFilter === ""
                  ? {
                      backgroundColor: "var(--color-white)",
                      color: "var(--color-black)",
                    }
                  : {
                      backgroundColor: "var(--color-charcoal)",
                      color: "var(--color-mist)",
                    }
              }
            >
              All
            </button>
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "" : cat)
                }
                className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all duration-200"
                style={
                  categoryFilter === cat
                    ? {
                        backgroundColor: "var(--color-violet)",
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
        </div>

        {/* My Collabs toggle */}
        {user && myPosts.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowMyPosts(!showMyPosts)}
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-white)]"
            >
              {showMyPosts ? "Hide" : "Show"} My Collabs ({myPosts.length})
            </button>
            {showMyPosts && (
              <div className="mt-4 space-y-3">
                {myPosts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/collaborate/${post.id}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-[var(--color-dark)] px-4 py-3 transition-all hover:border-[var(--color-coral)]"
                  >
                    <div>
                      <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">{post.title}</span>
                      {post.category && (
                        <span className="ml-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">{post.category}</span>
                      )}
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase ${
                      post.status === "open" ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                      : post.status === "filled" ? "bg-[var(--color-sky)]/15 text-[var(--color-sky)]"
                      : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                    }`}>
                      {post.status}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Loading posts...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              No collaboration posts yet. Be the first to post.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/collaborate/${post.id}`}
                className="block"
              >
                <div className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)] hover:shadow-[0_0_24px_rgba(250,146,119,0.12)]">
                  {/* Type badge + category */}
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold uppercase"
                      style={{
                        backgroundColor:
                          post.type === "looking_for"
                            ? "var(--color-coral)"
                            : "var(--color-lime)",
                        color: "var(--color-black)",
                      }}
                    >
                      {post.type === "looking_for" ? "Looking" : "Offering"}
                    </span>
                    {post.category && (
                      <span className="rounded-full border border-[var(--color-ash)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]">
                        {post.category}
                      </span>
                    )}
                    {post.status !== "open" && (
                      <span className="rounded-full bg-[var(--color-ash)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {post.status}
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg text-[var(--color-white)] leading-tight">
                    {post.title}
                  </h3>

                  {/* Description preview */}
                  {post.description && (
                    <p className="mt-2 line-clamp-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] leading-relaxed">
                      {post.description}
                    </p>
                  )}

                  {/* Positions tags */}
                  {post.positions && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {post.positions.split(",").map((pos: string, i: number) => (
                        <span
                          key={i}
                          className="rounded-full bg-[var(--color-violet)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-violet)]"
                        >
                          {pos.trim()}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Budget + Deadline + Team size */}
                  <div className="mt-3 flex flex-wrap gap-3">
                    {post.team_size && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)]">
                        {post.team_size} needed
                      </span>
                    )}
                    {post.budget && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]">
                        ${post.budget}
                      </span>
                    )}
                    {post.deadline && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]">
                        Due{" "}
                        {new Date(post.deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>

                  {/* Footer: avatar, name, responses, time */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                        {post.creators?.avatar_url ? (
                          <img
                            src={post.creators.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-[family-name:var(--font-display)] text-[8px] text-[var(--color-mist)]">
                            {(post.creators?.first_name?.[0] || "") +
                              (post.creators?.last_name?.[0] || "")}
                          </span>
                        )}
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]">
                        {post.creators?.first_name} {post.creators?.last_name}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {(responseCounts[post.id] ?? 0) > 0 && (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)]">
                          {responseCounts[post.id]} interested
                        </span>
                      )}
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {timeAgo(post.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[var(--color-dark)] p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
                New Collab Post
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="mt-6 space-y-4">
              {/* Type */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormType("looking_for")}
                  className="flex-1 rounded-lg py-2.5 font-[family-name:var(--font-mono)] text-xs transition-all"
                  style={{
                    backgroundColor:
                      formType === "looking_for"
                        ? "var(--color-coral)"
                        : "var(--color-charcoal)",
                    color:
                      formType === "looking_for"
                        ? "var(--color-black)"
                        : "var(--color-mist)",
                  }}
                >
                  Looking For
                </button>
                <button
                  type="button"
                  onClick={() => setFormType("offering")}
                  className="flex-1 rounded-lg py-2.5 font-[family-name:var(--font-mono)] text-xs transition-all"
                  style={{
                    backgroundColor:
                      formType === "offering"
                        ? "var(--color-lime)"
                        : "var(--color-charcoal)",
                    color:
                      formType === "offering"
                        ? "var(--color-black)"
                        : "var(--color-mist)",
                  }}
                >
                  Offering
                </button>
              </div>

              {/* Title */}
              <input
                type="text"
                placeholder="Title"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
              />

              {/* Description */}
              <textarea
                placeholder="Describe what you need or what you're offering..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] resize-none"
              />

              {/* Categories (multi-select) */}
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                  Categories (select all that apply)
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() =>
                        setFormCategories((prev) =>
                          prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                        )
                      }
                      className={`rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all ${
                        formCategories.includes(cat)
                          ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                          : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom category input when "Other" selected */}
              {formCategories.includes("Other") && (
                <input
                  type="text"
                  placeholder="Describe the type of creator..."
                  value={formCustomCategory}
                  onChange={(e) => setFormCustomCategory(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
              )}

              {/* Project Scope */}
              <textarea
                placeholder="Project scope — what's the idea? What are you building? (optional)"
                value={formScope}
                onChange={(e) => setFormScope(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
              />

              {/* Team size + Positions row */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  min="1"
                  max="50"
                  placeholder="Team size needed"
                  value={formTeamSize}
                  onChange={(e) => setFormTeamSize(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
                <input
                  type="text"
                  placeholder="Positions (e.g. Editor, DP)"
                  value={formPositions}
                  onChange={(e) => setFormPositions(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
              </div>

              {/* Budget + Deadline row */}
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Budget (optional)"
                  value={formBudget}
                  onChange={(e) => setFormBudget(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                />
              </div>

              {formError && (
                <p className="font-[family-name:var(--font-mono)] text-xs text-red-400">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
              >
                {submitting ? "Posting..." : "Post"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
