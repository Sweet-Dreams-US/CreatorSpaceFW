"use client";

import { useState } from "react";
import Link from "next/link";
import CommunityNav from "@/components/ui/CommunityNav";
import { submitInquiry } from "@/app/actions/inquiries";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

const SKILL_CATEGORIES = [
  "Video",
  "Photo",
  "Editor",
  "Music",
  "Design",
  "Writing",
  "Developer",
  "Aerial/Drone",
  "Marketing",
  "Animation",
  "Podcast",
  "Art",
  "Fashion",
  "Dance",
  "Film",
  "Other",
];

const BUDGET_OPTIONS = [
  "Under $500",
  "$500 - $1,000",
  "$1,000 - $5,000",
  "$5,000+",
  "Not Sure",
];

const TIMELINE_OPTIONS = ["ASAP", "1-2 Weeks", "1 Month", "Flexible"];

export default function HirePage() {
  const [businessName, setBusinessName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [timeline, setTimeline] = useState("");
  const [creatorTypes, setCreatorTypes] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function toggleCreatorType(type: string) {
    setCreatorTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!turnstileToken) {
      setError("Please complete the verification.");
      return;
    }

    setSubmitting(true);
    setError("");

    const result = await submitInquiry({
      business_name: businessName,
      contact_name: contactName,
      email,
      phone: phone || undefined,
      project_description: projectDescription,
      budget_range: budgetRange || undefined,
      timeline: timeline || undefined,
      creator_types: creatorTypes,
      turnstileToken,
    });

    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/"
            className="mb-10 inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to home
          </Link>

          <div className="mt-12 flex flex-col items-center rounded-xl border border-white/5 bg-[var(--color-dark)] px-8 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--color-lime)]/10">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--color-lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
              Thank You
            </h1>
            <p className="mt-3 max-w-md font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-smoke)]">
              We&apos;ve received your inquiry and will match you with the right creator. Expect to hear from us within 24-48 hours.
            </p>
            <Link
              href="/"
              className="mt-8 rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-32">
      <div className="mx-auto max-w-2xl">
        <CommunityNav />

        {/* Header */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl tracking-tight text-[var(--color-white)] sm:text-5xl">
          HIRE A CREATOR
        </h1>
        <p className="mt-3 max-w-xl font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Tell us what you need — we&apos;ll connect you with Fort Wayne&apos;s best.
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 sm:p-8">
            {error && (
              <div className="mb-6 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 font-[family-name:var(--font-mono)] text-xs text-red-400">
                {error}
              </div>
            )}

            <div className="flex flex-col gap-5">
              {/* Business Name */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Business Name <span className="text-[var(--color-coral)]">*</span>
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  placeholder="Your business or organization"
                />
              </div>

              {/* Contact Name */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Contact Name <span className="text-[var(--color-coral)]">*</span>
                </label>
                <input
                  type="text"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  placeholder="Your name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Email <span className="text-[var(--color-coral)]">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  placeholder="you@company.com"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Phone <span className="text-[var(--color-smoke)]">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  placeholder="(555) 123-4567"
                />
              </div>

              {/* Project Description */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Project Description <span className="text-[var(--color-coral)]">*</span>
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(e) => setProjectDescription(e.target.value)}
                  required
                  rows={4}
                  className="w-full resize-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
                  placeholder="Tell us about your project, goals, and what you're looking for..."
                />
              </div>

              {/* Budget Range */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Budget Range
                </label>
                <select
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                >
                  <option value="" className="text-[var(--color-smoke)]">Select a range</option>
                  {BUDGET_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeline */}
              <div>
                <label className="mb-1.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  Timeline
                </label>
                <select
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                  className="w-full appearance-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                >
                  <option value="" className="text-[var(--color-smoke)]">Select timeline</option>
                  {TIMELINE_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Creator Types */}
              <div>
                <label className="mb-2.5 block font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                  What type of creator do you need?
                </label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SKILL_CATEGORIES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleCreatorType(type)}
                      className={`rounded-lg border px-4 py-2.5 font-[family-name:var(--font-mono)] text-xs transition-all ${
                        creatorTypes.includes(type)
                          ? "border-[var(--color-coral)] bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
                          : "border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-smoke)]"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
                            creatorTypes.includes(type)
                              ? "border-[var(--color-coral)] bg-[var(--color-coral)]"
                              : "border-[var(--color-smoke)]"
                          }`}
                        >
                          {creatorTypes.includes(type) && (
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--color-black)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                        {type}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Turnstile */}
              <div className="mt-2">
                <TurnstileWidget
                  onSuccess={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !businessName || !contactName || !email || !projectDescription || !turnstileToken}
                className="mt-2 w-full rounded-full bg-[var(--color-coral)] py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,146,119,0.3)] disabled:opacity-50 disabled:hover:shadow-none"
              >
                {submitting ? "Submitting..." : "Submit Inquiry"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
