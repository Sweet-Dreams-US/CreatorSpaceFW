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
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      const url = new URL(window.location.href);

      // Check for error in URL params or hash
      const urlError =
        url.searchParams.get("error_description") ||
        url.hash.match(/error_description=([^&]*)/)?.[1];
      if (urlError) {
        setError(decodeURIComponent(urlError.replace(/\+/g, " ")));
        setReady(false);
        return;
      }

      // Check if we arrived from /auth/confirm (verified=true)
      const verified = url.searchParams.get("verified") === "true";

      // Try getSession — may need retries after redirect
      for (let attempt = 0; attempt < (verified ? 5 : 2); attempt++) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setReady(true);
          return;
        }
        // Wait before retry — cookies may not be available immediately
        if (attempt < (verified ? 4 : 1)) {
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (verified) {
        // Session was verified but cookies didn't persist — try refreshing
        window.location.reload();
        return;
      }

      setError("No active session. Please request a new password reset link.");
    }

    init();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setError("");
      }
    });

    return () => subscription.unsubscribe();
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

    try {
      const supabase = createClient();

      // Timeout after 10s to prevent infinite hang
      const result = await Promise.race([
        supabase.auth.updateUser({ password }),
        new Promise<{ error: { message: string } }>((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out. Please try again.")), 10000)
        ),
      ]);

      if (result && "error" in result && result.error) {
        setError(result.error.message);
        setLoading(false);
        return;
      }

      // Success
      setSuccess(true);
      setLoading(false);
      setTimeout(() => router.push("/profile/edit"), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password. Please try again.");
      setLoading(false);
    }
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
          {error && !ready
            ? ""
            : ready
            ? "Choose your new password."
            : "Verifying your reset link..."}
        </p>

        {/* Error state — expired or invalid link */}
        {error && !ready && (
          <div className="mt-8 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
              {error}
            </p>
            <Link
              href="/auth/forgot-password"
              className="mt-4 inline-block rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)]"
            >
              Request a New Reset Link
            </Link>
          </div>
        )}

        {!ready && !error && (
          <div className="mt-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-smoke)] border-t-[var(--color-coral)]" />
          </div>
        )}

        {success && (
          <div className="mt-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-lime)]">
              PASSWORD UPDATED
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Redirecting to your profile...
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-6"
          style={{ opacity: ready && !success ? 1 : 0.4, pointerEvents: ready && !success ? "auto" : "none", display: success ? "none" : undefined }}
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
