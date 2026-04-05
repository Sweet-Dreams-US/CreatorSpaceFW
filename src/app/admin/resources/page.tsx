"use client";

import { useState, useEffect, useCallback } from "react";
import { getResources, deleteResource } from "@/app/actions/resources";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  category: string;
  terms: string;
  price: string | null;
  availability: string;
  image_url: string | null;
  created_at: string;
  creators: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    slug: string | null;
  };
}

const CATEGORIES = [
  "all",
  "studio_space",
  "equipment",
  "software",
  "props",
  "locations",
  "vehicles",
  "other",
] as const;

export default function AdminResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const filters: { category?: string; availability?: string } = {};
    if (categoryFilter !== "all") filters.category = categoryFilter;
    // Pass no availability filter so we see everything in admin
    filters.availability = undefined;
    const data = await getResources(
      categoryFilter === "all" ? { availability: undefined } : { category: categoryFilter, availability: undefined }
    );
    setResources(data as Resource[]);
    setLoading(false);
  }, [categoryFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this resource?")) return;
    await deleteResource(id);
    setMessage("Resource deleted.");
    load();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCategory = (cat: string) => {
    return cat
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            RESOURCES
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            {resources.length} resource{resources.length !== 1 ? "s" : ""} listed
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

      {/* Category Filter */}
      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs capitalize transition-all ${
              categoryFilter === cat
                ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
            }`}
          >
            {cat === "all" ? "All" : formatCategory(cat)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ash)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-ash)] bg-[var(--color-dark)]">
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Title
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Category
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Creator
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Availability
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Terms
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Date
              </th>
              <th className="px-3 py-3 text-right font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  Loading...
                </td>
              </tr>
            ) : resources.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  No resources found.
                </td>
              </tr>
            ) : (
              resources.map((resource) => (
                <tr
                  key={resource.id}
                  className="border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
                >
                  <td className="max-w-[200px] px-3 py-3">
                    <p className="truncate font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                      {resource.title}
                    </p>
                    {resource.price && (
                      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-lime)]">
                        {resource.price}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span className="inline-block rounded-full bg-[var(--color-sky)]/15 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-sky)]">
                      {formatCategory(resource.category)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {resource.creators?.avatar_url ? (
                        <img
                          src={resource.creators.avatar_url}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-[8px] text-[var(--color-coral)]">
                          {(resource.creators?.first_name?.[0] || "")}{(resource.creators?.last_name?.[0] || "")}
                        </div>
                      )}
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {resource.creators?.first_name} {resource.creators?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
                        resource.availability === "available"
                          ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                          : resource.availability === "reserved"
                          ? "bg-[var(--color-violet)]/15 text-[var(--color-violet)]"
                          : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                      }`}
                    >
                      {resource.availability.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                    {formatCategory(resource.terms)}
                  </td>
                  <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                    {formatDate(resource.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleDelete(resource.id)}
                      className="font-[family-name:var(--font-mono)] text-xs text-red-400 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
