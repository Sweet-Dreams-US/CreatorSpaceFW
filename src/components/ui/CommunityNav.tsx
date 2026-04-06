"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin, hasModeratorAccess } from "@/lib/admin";

const NAV_LINKS = [
  { label: "Directory", href: "/directory" },
  { label: "Collaborate", href: "/collaborate" },
  { label: "Challenges", href: "/challenges" },
  { label: "Learn", href: "/learn" },
  { label: "Spotlight", href: "/spotlight" },
  { label: "Hire", href: "/hire", highlight: true },
];

export default function CommunityNav() {
  const pathname = usePathname();
  const { user, loading, role } = useAuth();
  const showAdmin = !loading && !!user && (isAdmin(user.email) || hasModeratorAccess(role));

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link
          href="/"
          className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
        >
          ← Home
        </Link>
        <span className="hidden h-3 w-px bg-[var(--color-ash)] sm:block" />
        {NAV_LINKS.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== "/" && pathname.startsWith(link.href + "/"));

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest transition-colors ${
                isActive
                  ? "text-[var(--color-coral)]"
                  : link.highlight
                  ? "text-[var(--color-lime)] hover:text-[var(--color-white)]"
                  : "text-[var(--color-smoke)] hover:text-[var(--color-white)]"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {showAdmin && (
          <Link
            href="/admin"
            className={`font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest transition-colors ${
              pathname.startsWith("/admin")
                ? "text-[var(--color-coral)]"
                : "text-[var(--color-coral)]/60 hover:text-[var(--color-coral)]"
            }`}
          >
            Admin
          </Link>
        )}
      </div>

      {/* Right side: auth */}
      <div className="flex items-center gap-3">
        {loading ? null : user ? (
          <Link
            href="/profile/edit"
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
          >
            Profile
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]"
          >
            Sign In
          </Link>
        )}
      </div>
    </div>
  );
}
