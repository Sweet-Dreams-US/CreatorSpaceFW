"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import PasswordInput from "@/components/ui/PasswordInput";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

export default function ResetPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      // If URL has a code param, exchange it for a session first
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          setReady(true);
          return;
        }
      }

      // Check if we already have a session (user clicked recovery link)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setReady(true);
        return;
      }
    }

    init();

    // Also listen for the PASSWORD_RECOVERY event
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
      }
    });

    // Fallback — if nothing fires in 5s, let them try anyway
    const timeout = setTimeout(() => setReady(true), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    if (password !== confirm) {
      setError("Passwords don't match.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    // Show success then redirect
    setLoading(false);
    setError("");
    setPassword("");
    setConfirm("");
    // Brief success state then redirect
    const el = document.querySelector("form");
    if (el) {
      el.innerHTML = `<div class="text-center py-8">
        <p class="font-[family-name:var(--font-display)] text-2xl text-[var(--color-lime)]">PASSWORD UPDATED</p>
        <p class="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Redirecting to your profile...</p>
      </div>`;
    }
    setTimeout(() => router.push("/profile/edit"), 2000);
  }

  const match =
    confirm.length > 0 && password === confirm
      ? true
      : confirm.length > 0
        ? false
        : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)] px-6">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          ← Back to Home
        </Link>

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
          NEW PASSWORD
        </h1>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          {ready
            ? "Choose your new password."
            : "Verifying your reset link..."}
        </p>

        {!ready && (
          <div className="mt-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-smoke)] border-t-[var(--color-coral)]" />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
          style={{ opacity: ready ? 1 : 0.4, pointerEvents: ready ? "auto" : "none" }}
        >
          <PasswordInput
            name="password"
            placeholder="New Password * (min 6 chars)"
            showStrength
            value={password}
            onChange={setPassword}
          />

          <div className="relative">
            <PasswordInput
              name="confirm"
              placeholder="Confirm Password *"
              value={confirm}
              onChange={setConfirm}
            />
            {match !== null && (
              <span
                className="absolute -bottom-5 left-0 font-[family-name:var(--font-mono)] text-[10px]"
                style={{ color: match ? "#9dfa77" : "#ef4444" }}
              >
                {match ? "Passwords match" : "Passwords don't match"}
              </span>
            )}
          </div>

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
            disabled={loading || !ready || !turnstileToken}
            className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "UPDATING..." : "SET NEW PASSWORD"}
          </button>
        </form>
      </div>
    </main>
  );
}
