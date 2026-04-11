"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAllChallenges,
  createChallenge,
  closeChallenge,
  getSubmissionCountsBatch,
} from "@/app/actions/challenges";

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  month: number;
  year: number;
  status: string;
  submission_deadline: string | null;
  created_at: string;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function AdminChallengesPage() {
  const now = new Date();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);
  const [message, setMessage] = useState("");

  // Form state
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMonth, setFormMonth] = useState(now.getMonth() + 1);
  const [formYear, setFormYear] = useState(now.getFullYear());
  const [formDeadline, setFormDeadline] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formEndsAt, setFormEndsAt] = useState("");
  const [formRules, setFormRules] = useState("");
  const [formHashtag, setFormHashtag] = useState("");
  const [formInstagram, setFormInstagram] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await getAllChallenges();
    setChallenges(data as Challenge[]);

    // Fetch submission counts (batch)
    const challengeIds = data.map((c: { id: string }) => c.id);
    const counts = await getSubmissionCountsBatch(challengeIds);
    setSubmissionCounts(counts);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;
    setCreating(true);
    const result = await createChallenge({
      title: formTitle,
      description: formDescription || undefined,
      month: formMonth,
      year: formYear,
      submission_deadline: formDeadline || undefined,
      starts_at: formStartsAt || undefined,
      ends_at: formEndsAt || undefined,
      rules: formRules || undefined,
      hashtag: formHashtag || undefined,
      instagram_handle: formInstagram || undefined,
    });
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Challenge created.");
      setFormTitle("");
      setFormDescription("");
      setFormDeadline("");
      setFormStartsAt("");
      setFormEndsAt("");
      setFormRules("");
      setFormHashtag("");
      setFormInstagram("");
      setShowForm(false);
      load();
    }
    setCreating(false);
  };

  const handleClose = async (id: string) => {
    if (!confirm("Close this challenge? It will be marked as past.")) return;
    setClosing(id);
    const result = await closeChallenge(id);
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Challenge closed.");
      load();
    }
    setClosing(null);
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            CHALLENGES
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            {challenges.length} challenge{challenges.length !== 1 ? "s" : ""} total
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-full bg-[var(--color-coral)] px-6 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
        >
          {showForm ? "Cancel" : "+ New Challenge"}
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            x
          </button>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-6"
        >
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            CREATE CHALLENGE
          </h2>
          <div className="mt-4 space-y-4">
            <div>
              <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Title *
              </label>
              <input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Challenge title..."
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Description
              </label>
              <textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Describe the challenge..."
                rows={3}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Month
                </label>
                <select
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                  className={inputClass}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Year
                </label>
                <select
                  value={formYear}
                  onChange={(e) => setFormYear(Number(e.target.value))}
                  className={inputClass}
                >
                  {[now.getFullYear(), now.getFullYear() + 1].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Deadline (legacy)
                </label>
                <input
                  type="date"
                  value={formDeadline}
                  onChange={(e) => setFormDeadline(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Strict Timeline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Starts At *
                </label>
                <input
                  type="datetime-local"
                  value={formStartsAt}
                  onChange={(e) => setFormStartsAt(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Ends At *
                </label>
                <input
                  type="datetime-local"
                  value={formEndsAt}
                  onChange={(e) => setFormEndsAt(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Rules */}
            <div>
              <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Rules & Requirements
              </label>
              <textarea
                value={formRules}
                onChange={(e) => setFormRules(e.target.value)}
                placeholder="1. Submit original work only&#10;2. Tag @creatorspacefw on Instagram&#10;3. Use the hashtag below&#10;4. Must be completed within the timeline"
                rows={5}
                className={inputClass}
              />
            </div>

            {/* Social Integration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Hashtag
                </label>
                <input
                  value={formHashtag}
                  onChange={(e) => setFormHashtag(e.target.value)}
                  placeholder="#CSFWChallenge"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Instagram Handle
                </label>
                <input
                  value={formInstagram}
                  onChange={(e) => setFormInstagram(e.target.value)}
                  placeholder="@creatorspacefw"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create Challenge"}
            </button>
          </div>
        </form>
      )}

      {/* Challenges List */}
      <div className="mt-6 space-y-3">
        {loading ? (
          <div className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Loading...
          </div>
        ) : challenges.length === 0 ? (
          <div className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            No challenges yet.
          </div>
        ) : (
          challenges.map((challenge) => (
            <div
              key={challenge.id}
              className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-5 transition-all hover:border-[var(--color-smoke)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
                      {challenge.title}
                    </h3>
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
                        challenge.status === "active"
                          ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                          : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                      }`}
                    >
                      {challenge.status.toUpperCase()}
                    </span>
                  </div>
                  {challenge.description && (
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {challenge.description}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-4">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {MONTHS[challenge.month - 1]} {challenge.year}
                    </span>
                    {challenge.submission_deadline && (
                      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                        Deadline:{" "}
                        {new Date(challenge.submission_deadline).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    )}
                    <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-violet)]">
                      <a href={`/challenges/${challenge.id}`} className="underline decoration-dotted underline-offset-4 hover:text-[var(--color-coral)]">
                        {submissionCounts[challenge.id] || 0} submission{(submissionCounts[challenge.id] || 0) !== 1 ? "s" : ""}
                      </a>
                    </span>
                  </div>
                </div>
                {challenge.status === "active" && (
                  <button
                    onClick={() => handleClose(challenge.id)}
                    disabled={closing === challenge.id}
                    className="rounded-full border border-[var(--color-ash)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-red-400 hover:text-red-400 disabled:opacity-50"
                  >
                    {closing === challenge.id ? "..." : "Close"}
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
