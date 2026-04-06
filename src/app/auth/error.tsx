"use client";

import Link from "next/link";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-black)] px-6">
      <div className="max-w-md text-center">
        <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
          Authentication Error
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          {error.message || "Something went wrong with authentication. Please try again."}
        </p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
          >
            Go back home
          </Link>
          <button
            onClick={reset}
            className="rounded-full bg-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)]"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
