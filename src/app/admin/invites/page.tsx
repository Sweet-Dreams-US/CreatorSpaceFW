"use client";

import { useState, useEffect, useCallback } from "react";
import { getAllCreatorsAdmin } from "@/app/actions/admin";

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  claimed: boolean;
  invite_token: string | null;
  invite_sent_at: string | null;
}

export default function AdminInvitesPage() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });

  const loadCreators = useCallback(async () => {
    const data = await getAllCreatorsAdmin();
    setCreators(data as Creator[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCreators();
  }, [loadCreators]);

  const isValidEmail = (email: string | null) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const unclaimed = creators.filter((c) => !c.claimed);
  const invitable = unclaimed.filter((c) => isValidEmail(c.email));
  const alreadyInvited = unclaimed.filter((c) => c.invite_sent_at);
  const notYetInvited = invitable.filter((c) => !c.invite_sent_at);
  const invalidEmail = unclaimed.filter((c) => !isValidEmail(c.email));

  const sendInvite = async (creatorId: string) => {
    setSendingId(creatorId);
    try {
      const res = await fetch("/api/admin/send-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorIds: [creatorId] }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(`Invite sent successfully.`);
        loadCreators();
      } else {
        setMessage(`Failed: ${data.error || "Unknown error"}`);
      }
    } catch {
      setMessage("Network error sending invite.");
    }
    setSendingId(null);
  };

  const sendAllInvites = async () => {
    if (!confirm(`Send invites to ${notYetInvited.length} creators?`)) return;
    setSending(true);
    setProgress({ sent: 0, failed: 0, total: notYetInvited.length });

    try {
      const res = await fetch("/api/admin/send-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorIds: notYetInvited.map((c) => c.id),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProgress({ sent: data.sent, failed: data.failed, total: notYetInvited.length });
        setMessage(`Sent ${data.sent} invites. ${data.failed} failed.`);
        loadCreators();
      } else {
        setMessage(`Failed: ${data.error}`);
      }
    } catch {
      setMessage("Network error sending invites.");
    }
    setSending(false);
  };

  const claimed = creators.filter((c) => c.claimed).length;

  return (
    <div className="max-w-5xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
        INVITATIONS
      </h1>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
        Send invitation emails to unclaimed creators
      </p>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <MiniStat label="Total" value={creators.length} />
        <MiniStat label="Claimed" value={claimed} color="lime" />
        <MiniStat label="Unclaimed" value={unclaimed.length} color="sky" />
        <MiniStat label="Invited" value={alreadyInvited.length} color="violet" />
        <MiniStat label="Ready to Send" value={notYetInvited.length} color="coral" />
      </div>

      {/* Invalid Emails Warning */}
      {invalidEmail.length > 0 && (
        <div className="mt-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-5 py-4">
          <p className="font-[family-name:var(--font-mono)] text-sm font-semibold text-yellow-400">
            {invalidEmail.length} creator(s) have invalid or missing emails
          </p>
          <div className="mt-2 space-y-1">
            {invalidEmail.slice(0, 5).map((c) => (
              <p
                key={c.id}
                className="font-[family-name:var(--font-mono)] text-xs text-yellow-400/70"
              >
                {c.first_name} {c.last_name} — {c.email || "(no email)"}
              </p>
            ))}
            {invalidEmail.length > 5 && (
              <p className="font-[family-name:var(--font-mono)] text-xs text-yellow-400/50">
                ...and {invalidEmail.length - 5} more
              </p>
            )}
          </div>
        </div>
      )}

      {/* Send All Button */}
      {notYetInvited.length > 0 && (
        <div className="mt-6">
          <button
            onClick={sendAllInvites}
            disabled={sending}
            className="rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
          >
            {sending
              ? `Sending... (${progress.sent}/${progress.total})`
              : `Send All Invites (${notYetInvited.length})`}
          </button>
        </div>
      )}

      {/* Creator List */}
      <div className="mt-8">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
          UNCLAIMED CREATORS
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-[var(--color-ash)]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[var(--color-ash)] bg-[var(--color-dark)]">
                <th className="px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Name
                </th>
                <th className="px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                    Loading...
                  </td>
                </tr>
              ) : unclaimed.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
                    All creators have claimed their profiles!
                  </td>
                </tr>
              ) : (
                unclaimed.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
                  >
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                      {creator.first_name} {creator.last_name}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                      {creator.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {creator.invite_sent_at ? (
                        <span className="rounded-full bg-[var(--color-violet)]/15 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-violet)]">
                          SENT{" "}
                          {new Date(creator.invite_sent_at).toLocaleDateString()}
                        </span>
                      ) : isValidEmail(creator.email) ? (
                        <span className="rounded-full bg-[var(--color-sky)]/15 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]">
                          READY
                        </span>
                      ) : (
                        <span className="rounded-full bg-yellow-500/15 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-yellow-400">
                          INVALID EMAIL
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isValidEmail(creator.email) && (
                        <button
                          onClick={() => sendInvite(creator.id)}
                          disabled={sendingId === creator.id}
                          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] hover:underline disabled:opacity-50"
                        >
                          {sendingId === creator.id
                            ? "Sending..."
                            : creator.invite_sent_at
                            ? "Resend"
                            : "Send Invite"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-4 text-center">
      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
        {label}
      </p>
      <p
        className="mt-1 font-[family-name:var(--font-display)] text-2xl"
        style={{ color: color ? `var(--color-${color})` : "var(--color-white)" }}
      >
        {value}
      </p>
    </div>
  );
}
