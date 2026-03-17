"use client";

import { useState } from "react";

export default function AdminSettingsPage() {
  const [adminEmails, setAdminEmails] = useState([
    "cole@sweetdreamsmusic.com",
    "zach@topspheremedia.com",
  ]);
  const [newEmail, setNewEmail] = useState("");
  const [saved, setSaved] = useState(false);

  const addEmail = () => {
    const email = newEmail.trim().toLowerCase();
    if (!email || adminEmails.includes(email)) return;
    setAdminEmails([...adminEmails, email]);
    setNewEmail("");
  };

  const removeEmail = (email: string) => {
    setAdminEmails(adminEmails.filter((e) => e !== email));
  };

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
        SETTINGS
      </h1>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
        Admin configuration
      </p>

      {saved && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          Settings saved.
          <button onClick={() => setSaved(false)} className="ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Admin Emails */}
      <div className="mt-8 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
          ADMIN EMAILS
        </h2>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          Users with these emails get admin access. Currently managed in code at src/lib/admin.ts — update there to persist changes.
        </p>

        <div className="mt-4 space-y-2">
          {adminEmails.map((email) => (
            <div
              key={email}
              className="flex items-center justify-between rounded-lg border border-[var(--color-ash)]/50 px-4 py-2.5"
            >
              <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                {email}
              </span>
              <button
                onClick={() => removeEmail(email)}
                className="font-[family-name:var(--font-mono)] text-xs text-red-400 hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex gap-3">
          <input
            placeholder="Add admin email..."
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addEmail()}
            className={`flex-1 ${inputClass}`}
          />
          <button
            onClick={addEmail}
            className="rounded-full border border-[var(--color-ash)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
          >
            Add
          </button>
        </div>
      </div>

      {/* Site Info */}
      <div className="mt-6 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
          SITE INFO
        </h2>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          Reference information about the deployment
        </p>

        <div className="mt-4 space-y-3">
          <InfoRow label="Framework" value="Next.js 16 + React 19" />
          <InfoRow label="Database" value="Supabase (PostgreSQL)" />
          <InfoRow label="Email" value="Resend" />
          <InfoRow label="Hosting" value="Vercel" />
        </div>
      </div>

      {/* Environment Variables */}
      <div className="mt-6 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
          ENVIRONMENT
        </h2>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          Required environment variables
        </p>

        <div className="mt-4 space-y-2">
          <EnvRow name="NEXT_PUBLIC_SUPABASE_URL" set={!!process.env.NEXT_PUBLIC_SUPABASE_URL} />
          <EnvRow name="NEXT_PUBLIC_SUPABASE_ANON_KEY" set={!!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY} />
          <EnvRow name="SUPABASE_SERVICE_ROLE_KEY" set />
          <EnvRow name="RESEND_API_KEY" set={false} />
          <EnvRow name="NEXT_PUBLIC_SITE_URL" set={false} />
        </div>
      </div>

      {/* Danger Zone */}
      <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/5 p-6">
        <h2 className="font-[family-name:var(--font-display)] text-lg text-red-400">
          DANGER ZONE
        </h2>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          Destructive actions that cannot be undone
        </p>
        <div className="mt-4 flex gap-3">
          <button
            onClick={() => alert("This would reset all invite_sent_at timestamps. Implement if needed.")}
            className="rounded-full border border-red-500/30 px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-red-400 transition-all hover:bg-red-500/10"
          >
            Reset All Invites
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-ash)]/30 pb-2">
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        {label}
      </span>
      <span className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
        {value}
      </span>
    </div>
  );
}

function EnvRow({ name, set }: { name: string; set: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--color-ash)]/30 pb-2">
      <code className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
        {name}
      </code>
      <span
        className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] ${
          set
            ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
            : "bg-yellow-500/15 text-yellow-400"
        }`}
      >
        {set ? "SET" : "MISSING"}
      </span>
    </div>
  );
}
