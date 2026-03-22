"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase injects the access token via hash fragment after clicking the reset link
    // The client library handles the exchange automatically
    const supabase = createClient();
    supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const password = formData.get("password") as string;
    const confirm = formData.get("confirm") as string;

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

    router.push("/profile/edit");
  }

  const inputClass =
    "w-full border-b border-[var(--color-smoke)] bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

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
            : "Loading your reset session..."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            name="password"
            type="password"
            placeholder="New Password * (min 6 chars)"
            required
            minLength={6}
            className={inputClass}
          />
          <input
            name="confirm"
            type="password"
            placeholder="Confirm Password *"
            required
            minLength={6}
            className={inputClass}
          />

          {error && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !ready}
            className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "UPDATING..." : "SET NEW PASSWORD"}
          </button>
        </form>
      </div>
    </main>
  );
}
