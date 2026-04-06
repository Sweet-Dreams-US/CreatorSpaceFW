"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthProvider";
import { acceptChallenge, hasAcceptedChallenge } from "@/app/actions/challenges";
import ChallengeSubmitForm from "./ChallengeSubmitForm";

interface Props {
  challengeId: string;
  canSubmit: boolean;
}

export default function ChallengeAcceptButton({ challengeId, canSubmit }: Props) {
  const { user, loading } = useAuth();
  const [accepted, setAccepted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    hasAcceptedChallenge(challengeId, user.id).then((result) => {
      setAccepted(result);
      setChecking(false);
    });
  }, [user, challengeId]);

  if (loading || checking) return null;

  if (!user) {
    return (
      <div className="mt-6 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          <Link href="/auth/login" className="text-[var(--color-coral)] hover:underline">
            Sign in
          </Link>{" "}
          to accept this challenge and submit your work.
        </p>
      </div>
    );
  }

  if (!accepted) {
    return (
      <div className="mt-6 rounded-xl border border-[var(--color-coral)]/20 bg-[var(--color-dark)] p-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          Accept this challenge to see submission details and submit your work.
        </p>
        <button
          onClick={async () => {
            setAccepting(true);
            const result = await acceptChallenge(challengeId);
            if (!result.error) {
              setAccepted(true);
            }
            setAccepting(false);
          }}
          disabled={accepting}
          className="mt-4 rounded-full bg-[var(--color-coral)] px-8 py-2.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:shadow-[0_0_24px_rgba(250,146,119,0.4)] disabled:opacity-50"
        >
          {accepting ? "Accepting..." : "Accept Challenge"}
        </button>
      </div>
    );
  }

  // Accepted — show submit form if still open
  if (canSubmit) {
    return <ChallengeSubmitForm challengeId={challengeId} />;
  }

  return (
    <div className="mt-6 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 text-center">
      <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
        You accepted this challenge!
      </p>
      <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Submissions are now closed.
      </p>
    </div>
  );
}
