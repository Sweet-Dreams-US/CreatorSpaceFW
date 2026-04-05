"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { createResource, getResources } from "@/app/actions/resources";

const RESOURCE_CATEGORIES = [
  "Equipment",
  "Studio Space",
  "Software",
  "Transport",
  "Props & Wardrobe",
  "Other",
];

const CATEGORY_COLORS: Record<string, string> = {
  Equipment: "var(--color-coral)",
  "Studio Space": "var(--color-violet)",
  Software: "var(--color-sky)",
  Transport: "var(--color-lime)",
  "Props & Wardrobe": "#f5c542",
  Other: "var(--color-mist)",
};

const TERMS_OPTIONS = ["All", "Free", "Trade", "Rental"] as const;

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
}

interface Resource {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  category: string;
  terms: string;
  price: string | null;
  image_url: string | null;
  availability: string;
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

function AvailabilityDot({ availability }: { availability: string }) {
  const color =
    availability === "available"
      ? "#4ade80"
      : availability === "reserved"
        ? "#facc15"
        : "#6b7280";
  return (
    <span
      className="inline-block h-2 w-2 rounded-full"
      style={{ backgroundColor: color }}
      title={availability}
    />
  );
}

export default function ResourcesPage() {
  const { user, loading: authLoading } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [termsFilter, setTermsFilter] = useState("All");
  const [availabilityFilter, setAvailabilityFilter] = useState("available");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formCategory, setFormCategory] = useState("Equipment");
  const [formTerms, setFormTerms] = useState("free");
  const [formPrice, setFormPrice] = useState("");
  const [formImageUrl, setFormImageUrl] = useState("");

  const fetchResources = useCallback(async () => {
    setLoading(true);
    const filters: { category?: string; terms?: string; availability?: string } =
      {};
    if (categoryFilter) filters.category = categoryFilter;
    if (termsFilter !== "All") filters.terms = termsFilter.toLowerCase();
    if (availabilityFilter === "all") filters.availability = "";
    // Default server action filters to "available" when not specified
    else if (availabilityFilter) filters.availability = availabilityFilter;

    const data = await getResources(
      availabilityFilter === "all" ? { ...filters, availability: "all" } : filters
    );
    setResources(data as Resource[]);
    setLoading(false);
  }, [categoryFilter, termsFilter, availabilityFilter]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!formTitle.trim()) {
      setFormError("Title is required");
      return;
    }
    setSubmitting(true);
    setFormError("");
    const result = await createResource({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      category: formCategory,
      terms: formTerms,
      price: formTerms === "rental" ? formPrice.trim() || undefined : undefined,
      image_url: formImageUrl.trim() || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      setFormError(result.error);
      return;
    }
    setFormTitle("");
    setFormDescription("");
    setFormCategory("Equipment");
    setFormTerms("free");
    setFormPrice("");
    setFormImageUrl("");
    setShowModal(false);
    fetchResources();
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Subtle gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #77dffa20, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          &larr; Back to Home
        </Link>

        {/* Header */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          COMMUNITY RESOURCES
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Share and borrow equipment, space, and more
        </p>

        {/* List a Resource button */}
        <div className="mt-8">
          {!authLoading && user ? (
            <button
              onClick={() => setShowModal(true)}
              className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
            >
              List a Resource
            </button>
          ) : (
            !authLoading && (
              <Link
                href="/auth/login"
                className="inline-block rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
              >
                Sign In to List
              </Link>
            )
          )}
        </div>

        {/* Filters */}
        <div className="mt-6 space-y-4">
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
            {RESOURCE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat ? "" : cat)
                }
                className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all duration-200"
                style={
                  categoryFilter === cat
                    ? {
                        backgroundColor:
                          CATEGORY_COLORS[cat] || "var(--color-coral)",
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

          {/* Terms + Availability row */}
          <div className="flex flex-wrap items-center gap-2">
            {TERMS_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setTermsFilter(opt)}
                className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all duration-200"
                style={
                  termsFilter === opt
                    ? {
                        backgroundColor: "var(--color-sky)",
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

            {/* Availability toggle */}
            {["available", "all"].map((opt) => (
              <button
                key={opt}
                onClick={() => setAvailabilityFilter(opt)}
                className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs capitalize transition-all duration-200"
                style={
                  availabilityFilter === opt
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
                {opt === "available" ? "Available" : "All"}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Loading resources...
            </p>
          </div>
        ) : resources.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              No resources listed yet. Be the first to share.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.id}
                href={`/resources/${resource.id}`}
                className="block"
              >
                <div className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)] hover:shadow-[0_0_24px_rgba(250,146,119,0.12)]">
                  {/* Image */}
                  {resource.image_url && (
                    <div className="mb-4 aspect-video overflow-hidden rounded-lg bg-[var(--color-charcoal)]">
                      <img
                        src={resource.image_url}
                        alt={resource.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  )}

                  {/* Category badge + availability + terms */}
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold"
                      style={{
                        backgroundColor:
                          CATEGORY_COLORS[resource.category] ||
                          "var(--color-mist)",
                        color: "var(--color-black)",
                      }}
                    >
                      {resource.category}
                    </span>
                    <span className="rounded-full border border-[var(--color-ash)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] capitalize text-[var(--color-mist)]">
                      {resource.terms}
                    </span>
                    <div className="ml-auto flex items-center gap-1.5">
                      <AvailabilityDot availability={resource.availability} />
                      <span className="font-[family-name:var(--font-mono)] text-[10px] capitalize text-[var(--color-smoke)]">
                        {resource.availability}
                      </span>
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg text-[var(--color-white)] leading-tight">
                    {resource.title}
                  </h3>

                  {/* Description preview */}
                  {resource.description && (
                    <p className="mt-2 line-clamp-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] leading-relaxed">
                      {resource.description}
                    </p>
                  )}

                  {/* Price if rental */}
                  {resource.terms === "rental" && resource.price && (
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                      ${resource.price}
                    </p>
                  )}

                  {/* Footer: creator */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                        {resource.creators?.avatar_url ? (
                          <img
                            src={resource.creators.avatar_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="font-[family-name:var(--font-display)] text-[8px] text-[var(--color-mist)]">
                            {(resource.creators?.first_name?.[0] || "") +
                              (resource.creators?.last_name?.[0] || "")}
                          </span>
                        )}
                      </div>
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]">
                        {resource.creators?.first_name}{" "}
                        {resource.creators?.last_name}
                      </span>
                    </div>
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {timeAgo(resource.created_at)}
                    </span>
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
                List a Resource
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-6 space-y-4">
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
                placeholder="Describe the resource..."
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] resize-none"
              />

              {/* Category */}
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
              >
                {RESOURCE_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Terms */}
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                  Terms
                </p>
                <div className="flex gap-2">
                  {["free", "trade", "rental"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFormTerms(t)}
                      className="flex-1 rounded-lg py-2.5 font-[family-name:var(--font-mono)] text-xs capitalize transition-all"
                      style={{
                        backgroundColor:
                          formTerms === t
                            ? "var(--color-sky)"
                            : "var(--color-charcoal)",
                        color:
                          formTerms === t
                            ? "var(--color-black)"
                            : "var(--color-mist)",
                      }}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price if rental */}
              {formTerms === "rental" && (
                <input
                  type="text"
                  placeholder="Price (e.g. 50/day)"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                />
              )}

              {/* Image URL */}
              <input
                type="text"
                placeholder="Image URL (optional)"
                value={formImageUrl}
                onChange={(e) => setFormImageUrl(e.target.value)}
                className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
              />

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
                {submitting ? "Listing..." : "List Resource"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
