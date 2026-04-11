"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase";
import { resendVerificationEmail } from "@/app/actions/auth";
import PasswordInput from "@/components/ui/PasswordInput";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim();
    const password = formData.get("password") as string;

    if (!email || !password) {
      setError("Email and password are required.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

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
          LOG IN
        </h1>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          Welcome back to Creator Space.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <input
            name="email"
            type="email"
            placeholder="Email *"
            required
            className={inputClass}
          />
          <PasswordInput
            name="password"
            placeholder="Password *"
          />

          {error && (
            <div>
              <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
                {error}
              </p>
              {error.toLowerCase().includes("confirm") && (
                <button
                  type="button"
                  onClick={async () => {
                    const form = document.querySelector("form") as HTMLFormElement;
                    const emailInput = form?.querySelector("input[name=email]") as HTMLInputElement;
                    if (!emailInput?.value) return;
                    setResending(true);
                    const result = await resendVerificationEmail(emailInput.value);
                    setResendMessage(result.error || "Verification email sent! Check your inbox.");
                    setResending(false);
                  }}
                  disabled={resending}
                  className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-white)] disabled:opacity-50"
                >
                  {resending ? "Sending..." : "Resend verification email"}
                </button>
              )}
              {resendMessage && (
                <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                  {resendMessage}
                </p>
              )}
            </div>
          )}

          <div className="text-right">
            <Link
              href="/auth/forgot-password"
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
            >
              Forgot password?
            </Link>
          </div>

          <TurnstileWidget
            onSuccess={setTurnstileToken}
            onExpire={() => setTurnstileToken("")}
          />

          <button
            type="submit"
            disabled={loading || !turnstileToken}
            className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "LOGGING IN..." : "LOG IN"}
          </button>
        </form>

        <p className="mt-6 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Don&apos;t have an account?{" "}
          <Link
            href="/auth/signup"
            className="text-[var(--color-coral)] hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
