"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-black)] px-6">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[var(--color-coral)]/30 bg-[var(--color-coral)]/10">
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-coral)]">!</span>
        </div>
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
          Something went wrong
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          {error.message || "An unexpected error occurred. The error has been automatically reported."}
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
            className="rounded-full bg-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
