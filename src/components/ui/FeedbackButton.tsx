"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { submitFeedback } from "@/app/actions/feedback";

export default function FeedbackButton() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"bug" | "improvement" | "feature_request" | "general">("bug");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !body.trim()) return;
    setSubmitting(true);
    await submitFeedback({
      type,
      feature: pathname,
      subject: subject.trim(),
      body: `${body.trim()}\n\n---\nPage: ${pathname}\nUA: ${navigator.userAgent}`,
    });
    setSubmitting(false);
    setSent(true);
    setTimeout(() => {
      setOpen(false);
      setSent(false);
      setSubject("");
      setBody("");
      setType("bug");
    }, 2000);
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-5 right-5 z-[90] flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-coral)] text-[var(--color-black)] shadow-[0_0_20px_rgba(250,146,119,0.3)] transition-all hover:scale-110"
        aria-label="Report bug or give feedback"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-[91] w-80 rounded-xl border border-white/10 bg-[var(--color-dark)] p-5 shadow-2xl">
          {sent ? (
            <div className="py-4 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-lime)]">Thanks!</p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">We got your feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h3 className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)]">
                Feedback
              </h3>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                Page: {pathname}
              </p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(["bug", "improvement", "feature_request", "general"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`rounded-full px-2.5 py-1 font-[family-name:var(--font-mono)] text-[9px] transition-all ${
                      type === t
                        ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                        : "border border-[var(--color-ash)] text-[var(--color-smoke)]"
                    }`}
                  >
                    {t === "bug" ? "Bug" : t === "improvement" ? "Improvement" : t === "feature_request" ? "Feature Idea" : "General"}
                  </button>
                ))}
              </div>

              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                required
                className="mt-3 w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-black)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="What happened? What did you expect?"
                rows={3}
                required
                className="mt-2 w-full resize-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-black)] px-3 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
              />
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-full border border-white/10 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-full bg-[var(--color-coral)] py-2 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-black)] disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </>
  );
}
