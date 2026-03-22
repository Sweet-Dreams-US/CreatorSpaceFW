"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllCreatorsAdmin } from "@/app/actions/admin";

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  claimed: boolean;
}

export default function AdminAnnouncementsPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [audience, setAudience] = useState<"all" | "claimed" | "unclaimed">("claimed");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState<
    Array<{ id: string; subject: string; sent_to: number; created_at: string }>
  >([]);

  const loadData = useCallback(async () => {
    const data = await getAllCreatorsAdmin();
    setCreators(data as Creator[]);

    // Load announcement history
    try {
      const res = await fetch("/api/admin/announcements");
      if (res.ok) {
        const hist = await res.json();
        setHistory(hist);
      }
    } catch {
      // History API may not exist yet
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isValidEmail = (email: string | null) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const recipients = creators.filter((c) => {
    if (!isValidEmail(c.email)) return false;
    if (audience === "claimed") return c.claimed;
    if (audience === "unclaimed") return !c.claimed;
    return true;
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    if (!confirm(`Send this announcement to ${recipients.length} creator(s)?`)) return;

    setSending(true);
    try {
      const res = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject,
          body,
          audience,
        }),
      });
      const data = await res.json();
      if (data.success) {
        const msg = data.failed > 0
          ? `Sent to ${data.sent}, failed ${data.failed}. ${data.firstError || ""}`
          : `Announcement sent to ${data.sent} creator(s).`;
        setMessage(msg);
        if (data.sent > 0) {
          setSubject("");
          setBody("");
        }
        loadData();
      } else {
        setMessage(`Failed: ${data.error}`);
      }
    } catch {
      setMessage("Network error.");
    }
    setSending(false);
  };

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  // Templates
  const templates = [
    {
      label: "Event Announcement",
      subject: "New Creator Space Event",
      body: "We have an exciting new event coming up!\n\n[Event details here]\n\nHope to see you there.",
    },
    {
      label: "Community Update",
      subject: "Creator Space Update",
      body: "Hey! Quick update from Creator Space Fort Wayne:\n\n[Update details here]\n\nStay creative.",
    },
    {
      label: "Welcome Message",
      subject: "Welcome to Creator Space FW",
      body: "Welcome to the Creator Space Fort Wayne community!\n\nWe're building something special here — a network of Fort Wayne's most talented creators.\n\nMake sure to claim your profile and connect with other creators in the directory.",
    },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
        ANNOUNCEMENTS
      </h1>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
        Broadcast emails to the community
      </p>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Templates */}
      <div className="mt-8">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
          Quick Templates
        </p>
        <div className="mt-3 flex gap-3">
          {templates.map((t) => (
            <button
              key={t.label}
              onClick={() => {
                setSubject(t.subject);
                setBody(t.body);
              }}
              className="rounded-full border border-[var(--color-ash)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Compose Form */}
      <form onSubmit={handleSend} className="mt-8 space-y-5">
        {/* Audience Selector */}
        <div>
          <p className="mb-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
            Audience
          </p>
          <div className="flex gap-3">
            {(["claimed", "unclaimed", "all"] as const).map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => setAudience(a)}
                className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs capitalize transition-all ${
                  audience === a
                    ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                    : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
                }`}
              >
                {a} ({creators.filter((c) => {
                  if (!isValidEmail(c.email)) return false;
                  if (a === "claimed") return c.claimed;
                  if (a === "unclaimed") return !c.claimed;
                  return true;
                }).length})
              </button>
            ))}
          </div>
        </div>

        <input
          placeholder="Subject *"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className={inputClass}
        />

        <textarea
          placeholder="Message body *"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className={`${inputClass} resize-none`}
        />

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={sending || !subject.trim() || !body.trim()}
            className="rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
          >
            {sending ? "Sending..." : `Send to ${recipients.length} Creator(s)`}
          </button>
        </div>
      </form>

      {/* History */}
      {history.length > 0 && (
        <div className="mt-12">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            SEND HISTORY
          </h2>
          <div className="mt-4 space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3"
              >
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                    {h.subject}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    Sent to {h.sent_to} creators —{" "}
                    {new Date(h.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
