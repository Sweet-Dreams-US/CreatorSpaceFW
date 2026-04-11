"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

export default function ForgotPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();

    if (!email) {
      setError("Email is required.");
      setLoading(false);
      return;
    }

    const supabase = createClient();

    // The email template must be configured in Supabase Dashboard to link to:
    // {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=/auth/reset-password
    // This bypasses PKCE entirely by using token_hash + verifyOtp server-side
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  const inputClass =
    "w-full border-b border-[var(--color-smoke)] bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)] px-6">
      <div className="w-full max-w-md">
        <Link
          href="/auth/login"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          ← Back to Login
        </Link>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
          RESET PASSWORD
        </h1>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          Enter your email and we&apos;ll send a reset link.
        </p>

        {sent ? (
          <div className="mt-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-lime)]">
              CHECK YOUR EMAIL
            </p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
              If an account exists with that email, we sent a password reset
              link.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <input
              name="email"
              type="email"
              placeholder="Email *"
              required
              className={inputClass}
            />

            {error && (
              <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
                {error}
              </p>
            )}

            <TurnstileWidget
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
            />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "SENDING..." : "SEND RESET LINK"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
