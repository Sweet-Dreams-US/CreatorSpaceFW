"use client";

import Link from "next/link";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-7xl">
      <div className="rounded-xl border border-red-400/20 bg-red-400/5 p-8 text-center">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
          Admin Error
        </h2>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          {error.message || "Something went wrong loading this admin page."}
        </p>
        <div className="mt-6 flex items-center justify-center gap-4">
          <Link
            href="/admin"
            className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
          >
            Back to Dashboard
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
