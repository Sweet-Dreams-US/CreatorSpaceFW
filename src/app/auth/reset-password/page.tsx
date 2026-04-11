"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { changePassword } from "@/app/actions/auth";
import PasswordInput from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  const [error, setError] = useState(() => {
    if (typeof window === "undefined") return "";
    const url = new URL(window.location.href);
    const urlError =
      url.searchParams.get("error_description") ||
      url.hash.match(/error_description=([^&]*)/)?.[1];
    return urlError ? decodeURIComponent(urlError.replace(/\+/g, " ")) : "";
  });
  const [loading, setLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const hasError = error && !success;

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

    // Use server action — it reads session from cookies server-side
    const result = await changePassword(password);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
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
          {hasError ? "" : success ? "" : "Choose your new password."}
        </p>

        {/* Error state — expired or invalid link */}
        {hasError && (
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

        {/* Success state */}
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

        {/* Form — always visible unless there's a URL error or success */}
        {!hasError && !success && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "UPDATING..." : "SET NEW PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
