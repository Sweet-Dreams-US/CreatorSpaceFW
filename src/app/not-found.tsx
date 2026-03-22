import Link from "next/link";

export default function NotFound() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--color-black)]">
      {/* Constellation dots background */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Static constellation dots with CSS animations */}
        <div className="absolute left-[10%] top-[15%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-coral)] opacity-40" style={{ animationDuration: "3s" }} />
        <div className="absolute left-[25%] top-[8%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-lime)] opacity-30" style={{ animationDuration: "4.2s", animationDelay: "0.5s" }} />
        <div className="absolute left-[45%] top-[20%] h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sky)] opacity-25" style={{ animationDuration: "2.8s", animationDelay: "1s" }} />
        <div className="absolute left-[70%] top-[12%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-violet)] opacity-35" style={{ animationDuration: "3.5s", animationDelay: "0.3s" }} />
        <div className="absolute left-[85%] top-[25%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-coral)] opacity-20" style={{ animationDuration: "5s", animationDelay: "1.5s" }} />
        <div className="absolute left-[15%] top-[45%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-sky)] opacity-30" style={{ animationDuration: "4s", animationDelay: "0.8s" }} />
        <div className="absolute left-[55%] top-[40%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-lime)] opacity-20" style={{ animationDuration: "3.2s", animationDelay: "2s" }} />
        <div className="absolute left-[80%] top-[50%] h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-coral)] opacity-30" style={{ animationDuration: "2.5s", animationDelay: "0.7s" }} />
        <div className="absolute left-[30%] top-[65%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-violet)] opacity-25" style={{ animationDuration: "4.5s", animationDelay: "1.2s" }} />
        <div className="absolute left-[60%] top-[70%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-sky)] opacity-35" style={{ animationDuration: "3.8s", animationDelay: "0.4s" }} />
        <div className="absolute left-[5%] top-[75%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-lime)] opacity-20" style={{ animationDuration: "5.2s", animationDelay: "1.8s" }} />
        <div className="absolute left-[90%] top-[80%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-violet)] opacity-30" style={{ animationDuration: "3s", animationDelay: "0.6s" }} />
        <div className="absolute left-[40%] top-[85%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-coral)] opacity-25" style={{ animationDuration: "4.8s", animationDelay: "2.2s" }} />
        <div className="absolute left-[75%] top-[90%] h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--color-sky)] opacity-20" style={{ animationDuration: "3.6s", animationDelay: "1.4s" }} />
        <div className="absolute left-[20%] top-[92%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-lime)] opacity-30" style={{ animationDuration: "4.3s", animationDelay: "0.9s" }} />
        <div className="absolute left-[50%] top-[55%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-violet)] opacity-35" style={{ animationDuration: "2.7s", animationDelay: "1.6s" }} />
        <div className="absolute left-[35%] top-[30%] h-1 w-1 animate-pulse rounded-full bg-[var(--color-coral)] opacity-20" style={{ animationDuration: "5.5s", animationDelay: "0.2s" }} />
        <div className="absolute left-[65%] top-[35%] h-0.5 w-0.5 animate-pulse rounded-full bg-[var(--color-sky)] opacity-25" style={{ animationDuration: "3.4s", animationDelay: "1.1s" }} />
      </div>

      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, #fa927730, transparent)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-6 px-6 text-center">
        <h1 className="font-[family-name:var(--font-display)] text-[10rem] leading-none text-[var(--color-coral)] sm:text-[14rem]">
          404
        </h1>
        <p className="font-[family-name:var(--font-mono)] text-lg tracking-wide text-[var(--color-smoke)] sm:text-xl">
          Page not found
        </p>
        <p className="max-w-md font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          This page doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
          <Link
            href="/"
            className="rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-xs font-semibold uppercase tracking-widest text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740]"
          >
            Back to Home
          </Link>
          <Link
            href="/directory"
            className="rounded-full border border-white/10 px-8 py-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-smoke)] transition-all duration-300 hover:border-[var(--color-coral)] hover:text-[var(--color-white)]"
          >
            Creator Directory
          </Link>
        </div>
      </div>
    </main>
  );
}
