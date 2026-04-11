"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getAllFeedback, updateFeedbackStatus } from "@/app/actions/feedback";

interface Feedback {
  id: string;
  type: string;
  feature: string | null;
  subject: string;
  body: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  creators: { first_name: string; last_name: string; slug: string | null } | null;
}

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug",
  feature_request: "Feature",
  improvement: "Improvement",
  general: "General",
};

const STATUS_OPTIONS = ["new", "reviewing", "planned", "resolved", "wont_fix"];

const STATUS_COLORS: Record<string, string> = {
  new: "var(--color-coral)",
  reviewing: "var(--color-violet)",
  planned: "var(--color-sky)",
  resolved: "var(--color-lime)",
  wont_fix: "var(--color-smoke)",
};

export default function AdminFeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const data = await getAllFeedback();
    setFeedback(data as Feedback[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === "all" ? feedback : feedback.filter((f) => f.status === filter);

  async function handleStatusChange(id: string, status: string) {
    await updateFeedbackStatus(id, status);
    setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, status } : f));
  }

  async function handleRespond(id: string) {
    if (!responseText.trim()) return;
    await updateFeedbackStatus(id, "reviewing", responseText.trim());
    setFeedback((prev) => prev.map((f) => f.id === id ? { ...f, admin_response: responseText.trim(), status: "reviewing" } : f));
    setRespondingTo(null);
    setResponseText("");
    setMessage("Response saved.");
    setTimeout(() => setMessage(""), 3000);
  }

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">FEEDBACK</h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            {feedback.length} total — {feedback.filter((f) => f.status === "new").length} new
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {["all", ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all ${
              filter === s
                ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-coral)]"
            }`}
          >
            {s === "all" ? `All (${feedback.length})` : `${s.replace("_", " ")} (${feedback.filter((f) => f.status === s).length})`}
          </button>
        ))}
      </div>

      {/* Feedback list */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <p className="py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Loading...</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            No feedback{filter !== "all" ? ` with status "${filter}"` : ""}.
          </div>
        ) : (
          filtered.map((fb) => (
            <div key={fb.id} className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] font-semibold uppercase tracking-wider"
                      style={{ color: STATUS_COLORS[fb.status], backgroundColor: `color-mix(in srgb, ${STATUS_COLORS[fb.status]} 15%, transparent)` }}
                    >
                      {fb.status.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-mist)]">
                      {TYPE_LABELS[fb.type] || fb.type}
                    </span>
                    {fb.feature && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">{fb.feature}</span>
                    )}
                    <span className="ml-auto font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {new Date(fb.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>

                  {/* Creator */}
                  {fb.creators && (
                    <Link
                      href={fb.creators.slug ? `/directory/${fb.creators.slug}` : "#"}
                      className="mt-2 inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] hover:underline"
                    >
                      {fb.creators.first_name} {fb.creators.last_name}
                    </Link>
                  )}

                  {/* Content */}
                  <h3 className="mt-2 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-white)]">
                    {fb.subject}
                  </h3>
                  <p className="mt-1 whitespace-pre-line font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--color-mist)]">
                    {fb.body}
                  </p>

                  {/* Admin response */}
                  {fb.admin_response && (
                    <div className="mt-3 rounded-lg border border-[var(--color-coral)]/20 bg-[var(--color-coral)]/5 p-3">
                      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-coral)]">Your Response</p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">{fb.admin_response}</p>
                    </div>
                  )}
                </div>

                {/* Status dropdown */}
                <select
                  value={fb.status}
                  onChange={(e) => handleStatusChange(fb.id, e.target.value)}
                  className="shrink-0 rounded-full border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)] outline-none"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>{s.replace("_", " ")}</option>
                  ))}
                </select>
              </div>

              {/* Respond button */}
              <div className="mt-3 border-t border-white/5 pt-3">
                {respondingTo === fb.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder="Write a response to the user..."
                      rows={2}
                      className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-black)] p-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleRespond(fb.id)}
                        className="rounded-full bg-[var(--color-coral)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-black)]"
                      >
                        Send Response
                      </button>
                      <button
                        onClick={() => { setRespondingTo(null); setResponseText(""); }}
                        className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setRespondingTo(fb.id); setResponseText(fb.admin_response || ""); }}
                    className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)] hover:underline"
                  >
                    {fb.admin_response ? "Edit Response" : "Respond"}
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
