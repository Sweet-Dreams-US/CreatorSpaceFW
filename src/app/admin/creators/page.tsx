"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllCreatorsAdmin,
  adminDeleteCreator,
  adminDeleteCreators,
  adminAddCreator,
  adminUpdateCreator,
  exportCreatorsCSV,
  updateCreatorRole,
} from "@/app/actions/admin";

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  company: string | null;
  job_title: string | null;
  skills: string | null;
  social: string | null;
  website: string | null;
  bio: string | null;
  slug: string | null;
  claimed: boolean;
  role: string | null;
  avatar_url: string | null;
  invite_sent_at: string | null;
  created_at: string;
}

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "claimed" | "unclaimed">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadCreators = useCallback(async () => {
    const data = await getAllCreatorsAdmin();
    setCreators(data as Creator[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const filtered = creators.filter((c) => {
    const matchesSearch =
      !search ||
      `${c.first_name} ${c.last_name} ${c.email} ${c.company} ${c.skills}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesFilter =
      filter === "all" ||
      (filter === "claimed" && c.claimed) ||
      (filter === "unclaimed" && !c.claimed);

    return matchesSearch && matchesFilter;
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} creator(s)? This cannot be undone.`)) return;
    await adminDeleteCreators(Array.from(selected));
    setSelected(new Set());
    setMessage(`Deleted ${selected.size} creator(s).`);
    loadCreators();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this creator? This cannot be undone.")) return;
    await adminDeleteCreator(id);
    setMessage("Creator deleted.");
    loadCreators();
  };

  const handleExport = async () => {
    const result = await exportCreatorsCSV();
    if (result.error || !result.csv) {
      setMessage("Export failed.");
      return;
    }
    const blob = new Blob([result.csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `creators-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage("CSV downloaded.");
  };

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            CREATORS
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            {creators.length} total — {creators.filter((c) => c.claimed).length} claimed
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExport}
            className="rounded-full border border-[var(--color-ash)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-sky)] hover:text-[var(--color-sky)]"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="rounded-full bg-[var(--color-coral)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
          >
            + Add Creator
          </button>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Search & Filter */}
      <div className="mt-6 flex gap-4">
        <input
          type="text"
          placeholder="Search by name, email, company, skills..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
        />
        <div className="flex gap-2">
          {(["all", "claimed", "unclaimed"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs capitalize transition-all ${
                filter === f
                  ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                  : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
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
                  checked={selected.size === filtered.length && filtered.length > 0}
                  onChange={toggleSelectAll}
                  className="accent-[var(--color-coral)]"
                />
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Name
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Email
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Company
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Status
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Role
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                  Loading...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                  No creators found.
                </td>
              </tr>
            ) : (
              filtered.map((creator) => (
                <tr
                  key={creator.id}
                  className="border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
                >
                  <td className="px-3 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(creator.id)}
                      onChange={() => toggleSelect(creator.id)}
                      className="accent-[var(--color-coral)]"
                    />
                  </td>
                  <td className="px-3 py-3">
                    {editingId === creator.id ? (
                      <InlineEdit
                        creator={creator}
                        onSave={async (data) => {
                          await adminUpdateCreator(creator.id, data);
                          setEditingId(null);
                          loadCreators();
                        }}
                        onCancel={() => setEditingId(null)}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-[10px] text-[var(--color-coral)]">
                          {(creator.first_name?.[0] || "")}{(creator.last_name?.[0] || "")}
                        </div>
                        <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                          {creator.first_name} {creator.last_name}
                        </span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                    {creator.email || "—"}
                  </td>
                  <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                    {creator.company || "—"}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
                        creator.claimed
                          ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                          : creator.invite_sent_at
                          ? "bg-[var(--color-violet)]/15 text-[var(--color-violet)]"
                          : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                      }`}
                    >
                      {creator.claimed ? "CLAIMED" : creator.invite_sent_at ? "INVITED" : "UNCLAIMED"}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      value={creator.role || "creator"}
                      onChange={async (e) => {
                        const newRole = e.target.value;
                        await updateCreatorRole(creator.id, newRole);
                        setCreators((prev) =>
                          prev.map((c) =>
                            c.id === creator.id ? { ...c, role: newRole } : c
                          )
                        );
                        setMessage(`${creator.first_name} ${creator.last_name} → ${newRole}`);
                      }}
                      className={`rounded-full px-2.5 py-1 font-[family-name:var(--font-mono)] text-[10px] font-semibold outline-none ${
                        creator.role === "admin"
                          ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                          : creator.role === "board"
                          ? "bg-[var(--color-violet)]/15 text-[var(--color-violet)]"
                          : "bg-[var(--color-ash)]/30 text-[var(--color-smoke)]"
                      }`}
                    >
                      <option value="creator">Creator</option>
                      <option value="board">Board</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-2">
                      {editingId !== creator.id && (
                        <button
                          onClick={() => setEditingId(creator.id)}
                          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)] hover:underline"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(creator.id)}
                        className="font-[family-name:var(--font-mono)] text-xs text-red-400 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Creator Modal */}
      {showAdd && (
        <AddCreatorModal
          onClose={() => setShowAdd(false)}
          onAdded={() => {
            setShowAdd(false);
            setMessage("Creator added.");
            loadCreators();
          }}
        />
      )}
    </div>
  );
}

function InlineEdit({
  creator,
  onSave,
  onCancel,
}: {
  creator: Creator;
  onSave: (data: Record<string, string>) => Promise<void>;
  onCancel: () => void;
}) {
  const [data, setData] = useState({
    first_name: creator.first_name || "",
    last_name: creator.last_name || "",
    email: creator.email || "",
    company: creator.company || "",
    job_title: creator.job_title || "",
    skills: creator.skills || "",
  });
  const [saving, setSaving] = useState(false);

  const inputClass =
    "border-b border-[var(--color-ash)] bg-transparent px-1 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)] outline-none focus:border-[var(--color-coral)] transition-colors";

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          value={data.first_name}
          onChange={(e) => setData({ ...data, first_name: e.target.value })}
          placeholder="First"
          className={`w-24 ${inputClass}`}
        />
        <input
          value={data.last_name}
          onChange={(e) => setData({ ...data, last_name: e.target.value })}
          placeholder="Last"
          className={`w-24 ${inputClass}`}
        />
      </div>
      <input
        value={data.email}
        onChange={(e) => setData({ ...data, email: e.target.value })}
        placeholder="Email"
        className={`w-48 ${inputClass}`}
      />
      <input
        value={data.company}
        onChange={(e) => setData({ ...data, company: e.target.value })}
        placeholder="Company"
        className={`w-40 ${inputClass}`}
      />
      <input
        value={data.skills}
        onChange={(e) => setData({ ...data, skills: e.target.value })}
        placeholder="Skills"
        className={`w-48 ${inputClass}`}
      />
      <div className="flex gap-2 pt-1">
        <button
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            await onSave(data);
          }}
          className="rounded bg-[var(--color-coral)] px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-black)]"
        >
          {saving ? "..." : "Save"}
        </button>
        <button
          onClick={onCancel}
          className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] hover:text-[var(--color-white)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function AddCreatorModal({
  onClose,
  onAdded,
}: {
  onClose: () => void;
  onAdded: () => void;
}) {
  const [data, setData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    company: "",
    job_title: "",
    skills: "",
    social: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.first_name.trim()) {
      setError("First name is required.");
      return;
    }
    setSaving(true);
    const result = await adminAddCreator(data);
    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }
    onAdded();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
          ADD CREATOR
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="First Name *"
              value={data.first_name}
              onChange={(e) => setData({ ...data, first_name: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Last Name"
              value={data.last_name}
              onChange={(e) => setData({ ...data, last_name: e.target.value })}
              className={inputClass}
            />
          </div>
          <input
            placeholder="Email"
            value={data.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Company"
            value={data.company}
            onChange={(e) => setData({ ...data, company: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Job Title"
            value={data.job_title}
            onChange={(e) => setData({ ...data, job_title: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Skills (comma separated)"
            value={data.skills}
            onChange={(e) => setData({ ...data, skills: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Social handles"
            value={data.social}
            onChange={(e) => setData({ ...data, social: e.target.value })}
            className={inputClass}
          />

          {error && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Creator"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--color-ash)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
