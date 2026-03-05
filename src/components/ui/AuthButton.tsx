"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";

export default function AuthButton() {
  const { user, loading } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
      >
        Log in
      </Link>
    );
  }

  return (
    <Link
      href="/profile/edit"
      className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
    >
      Edit Profile
    </Link>
  );
}
