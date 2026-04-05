"use client";

import { useState, useEffect, useCallback } from "react";
import { getCollabPosts, deleteCollabPost } from "@/app/actions/collaborate";

interface CollabPost {
  id: string;
  type: "looking_for" | "offering";
  title: string;
  description: string | null;
  category: string | null;
  budget: string | null;
  deadline: string | null;
  status: string;
  created_at: string;
  creators: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    avatar_url: string | null;
    slug: string | null;
  };
}

const STATUS_OPTIONS = ["all", "open", "in_progress", "closed"] as const;

export default function AdminCollaboratePage() {
  const [posts, setPosts] = useState<CollabPost[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getCollabPosts(
      statusFilter === "all" ? { status: undefined } : { status: statusFilter }
    );
    setPosts(data as CollabPost[]);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this collab post?")) return;
    await deleteCollabPost(id);
    setMessage("Post deleted.");
    load();
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} collab post(s)?`)) return;
    for (const id of selected) {
      await deleteCollabPost(id);
    }
    setSelected(new Set());
    setMessage(`Deleted ${selected.size} post(s).`);
    load();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            COLLAB BOARD
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            {posts.length} post{posts.length !== 1 ? "s" : ""}
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

      {/* Status Filter */}
      <div className="mt-6 flex gap-2">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setSelected(new Set());
            }}
            className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs capitalize transition-all ${
              statusFilter === s
                ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
            }`}
          >
            {s === "in_progress" ? "In Progress" : s}
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <div className="mt-4 flex items-center gap-4 rounded-lg border border-[var(--color-violet)]/30 bg-[var(--color-violet)]/5 px-4 py-3">
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-violet)]">
            {selected.size} selected
          </p>
          <button
            onClick={handleBulkDelete}
            className="rounded-full bg-red-500/20 px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-red-400 transition-all hover:bg-red-500/30"
          >
            Delete Selected
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] hover:text-[var(--color-white)]"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ash)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-ash)] bg-[var(--color-dark)]">
              <th className="px-3 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selected.size === posts.length && posts.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-[var(--color-coral)]"
                />
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Title
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Type
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Creator
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Status
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
            ) : posts.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  No collab posts found.
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr
                  key={post.id}
                  className="border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(post.id)}
                      onChange={() => toggleSelect(post.id)}
                      className="accent-[var(--color-coral)]"
                    />
                  </td>
                  <td className="max-w-[200px] px-3 py-3">
                    <p className="truncate font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                      {post.title}
                    </p>
                    {post.category && (
                      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {post.category}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
                        post.type === "looking_for"
                          ? "bg-[var(--color-sky)]/15 text-[var(--color-sky)]"
                          : "bg-[var(--color-violet)]/15 text-[var(--color-violet)]"
                      }`}
                    >
                      {post.type === "looking_for" ? "LOOKING FOR" : "OFFERING"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      {post.creators?.avatar_url ? (
                        <img
                          src={post.creators.avatar_url}
                          alt=""
                          className="h-6 w-6 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-[8px] text-[var(--color-coral)]">
                          {(post.creators?.first_name?.[0] || "")}{(post.creators?.last_name?.[0] || "")}
                        </div>
                      )}
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {post.creators?.first_name} {post.creators?.last_name}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
                        post.status === "open"
                          ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                          : post.status === "in_progress"
                          ? "bg-[var(--color-sky)]/15 text-[var(--color-sky)]"
                          : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                      }`}
                    >
                      {post.status.toUpperCase().replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                    {formatDate(post.created_at)}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button
                      onClick={() => handleDelete(post.id)}
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
