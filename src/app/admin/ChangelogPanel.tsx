"use client";

import { useState } from "react";
import { createPlatformUpdate } from "@/app/actions/admin";

interface Update {
  id: string;
  title: string;
  description: string;
  level: string;
  version: string | null;
  created_at: string;
}

export default function ChangelogPanel({ updates }: { updates: Update[] }) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [level, setLevel] = useState<"user" | "admin">("user");
  const [version, setVersion] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    const result = await createPlatformUpdate({ title, description, level, version: version || undefined });
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Update posted.");
      setTitle("");
      setDescription("");
      setVersion("");
      setShowForm(false);
    }
    setSaving(false);
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
          PLATFORM UPDATES
        </h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full border border-[var(--color-ash)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
        >
          {showForm ? "Cancel" : "+ Add Update"}
        </button>
      </div>

      {message && (
        <div className="mt-3 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">x</button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-4 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-5 space-y-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Update title..."
            className={inputClass}
            required
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What changed? Bug fixes, new features, improvements..."
            rows={3}
            className={inputClass}
            required
          />
          <div className="flex gap-3">
            <input
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="Version (optional, e.g. v1.4)"
              className={inputClass}
            />
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setLevel("user")}
                className={`rounded-full px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider transition-all ${
                  level === "user"
                    ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                    : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
                }`}
              >
                User-facing
              </button>
              <button
                type="button"
                onClick={() => setLevel("admin")}
                className={`rounded-full px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider transition-all ${
                  level === "admin"
                    ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                    : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
                }`}
              >
                Admin-only
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] disabled:opacity-50"
          >
            {saving ? "Posting..." : "Post Update"}
          </button>
        </form>
      )}

      <div className="mt-4 space-y-3">
        {updates.length === 0 ? (
          <p className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-5 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            No updates yet.
          </p>
        ) : (
          updates.slice(0, 10).map((update) => (
            <div
              key={update.id}
              className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase tracking-wider ${
                    update.level === "admin"
                      ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                      : "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                  }`}
                >
                  {update.level}
                </span>
                {update.version && (
                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-violet)]">
                    {update.version}
                  </span>
                )}
                <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                  {new Date(update.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <h3 className="mt-2 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-white)]">
                {update.title}
              </h3>
              <p className="mt-1 whitespace-pre-line font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--color-mist)]">
                {update.description}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
