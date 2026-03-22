"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { claimOrCreateCreator } from "@/app/actions/auth";
import PasswordInput from "@/components/ui/PasswordInput";

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)]">
          <div className="font-[family-name:var(--font-mono)] text-[var(--color-smoke)]">Loading...</div>
        </main>
      }
    >
      <SignupForm />
    </Suspense>
  );
}

function SignupForm() {
  const searchParams = useSearchParams();
  const prefillEmail = searchParams.get("email") || "";
  const inviteToken = searchParams.get("token") || undefined;

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const firstName = (formData.get("first_name") as string)?.trim();
    const lastName = (formData.get("last_name") as string)?.trim();
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName },
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    const userId = authData.user?.id;
    if (!userId) {
      setError("Signup failed. Please try again.");
      setLoading(false);
      return;
    }

    // Create/claim the creators row via server action (uses admin client)
    const result = await claimOrCreateCreator({
      userId,
      firstName,
      lastName,
      email,
      inviteToken,
    });

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // If Supabase requires email confirmation, session won't exist yet
    if (!authData.session) {
      setCheckEmail(true);
      setLoading(false);
      return;
    }

    // If email confirmation is disabled, session exists — go straight to profile
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
          SIGN UP
        </h1>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          {inviteToken
            ? "Claim your Creator Space profile."
            : "Create your Creator Space account."}
        </p>

        {checkEmail ? (
          <div className="mt-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-lime)]">
              CHECK YOUR EMAIL
            </p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
              We sent a confirmation link. Click it to finish signing up.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <input
                name="first_name"
                placeholder="First Name *"
                required
                className={inputClass}
              />
              <input
                name="last_name"
                placeholder="Last Name *"
                required
                className={inputClass}
              />
            </div>
            <input
              name="email"
              type="email"
              placeholder="Email *"
              required
              defaultValue={prefillEmail}
              className={inputClass}
            />
            <PasswordInput
              name="password"
              placeholder="Password * (min 6 chars)"
              showStrength
            />

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
              {loading ? "CREATING ACCOUNT..." : inviteToken ? "CLAIM YOUR PROFILE" : "SIGN UP"}
            </button>
          </form>
        )}

        <p className="mt-6 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="text-[var(--color-coral)] hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
