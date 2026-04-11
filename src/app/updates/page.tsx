"use client";

import { useEffect, useState } from "react";
import CommunityNav from "@/components/ui/CommunityNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { getPlatformUpdates } from "@/app/actions/admin";
import { submitFeedback, getMyFeedback, getFeatureOptions } from "@/app/actions/feedback";

interface Update {
  id: string;
  title: string;
  description: string;
  level: string;
  version: string | null;
  created_at: string;
}

interface Feedback {
  id: string;
  type: string;
  feature: string | null;
  subject: string;
  body: string;
  status: string;
  admin_response: string | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  bug: "Bug Report",
  feature_request: "Feature Request",
  improvement: "Improvement",
  general: "General Feedback",
};

const STATUS_COLORS: Record<string, string> = {
  new: "var(--color-sky)",
  reviewing: "var(--color-violet)",
  planned: "var(--color-lime)",
  resolved: "var(--color-lime)",
  wont_fix: "var(--color-smoke)",
};

export default function UpdatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [updates, setUpdates] = useState<Update[]>([]);
  const [myFeedback, setMyFeedback] = useState<Feedback[]>([]);
  const [featureOptions, setFeatureOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);

  // Feedback form state
  const [fbType, setFbType] = useState<"bug" | "feature_request" | "improvement" | "general">("general");
  const [fbFeature, setFbFeature] = useState("");
  const [fbSubject, setFbSubject] = useState("");
  const [fbBody, setFbBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  useEffect(() => {
    async function load() {
      const [updatesData, options] = await Promise.all([
        getPlatformUpdates("user"),
        getFeatureOptions(),
      ]);
      setUpdates(updatesData as Update[]);
      setFeatureOptions(options);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!user) return;
    getMyFeedback().then((data) => setMyFeedback(data as Feedback[]));
  }, [user]);

  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fbSubject.trim() || !fbBody.trim()) return;
    setSubmitting(true);
    const result = await submitFeedback({
      type: fbType,
      feature: fbFeature || undefined,
      subject: fbSubject.trim(),
      body: fbBody.trim(),
    });
    if (result.error) {
      setSubmitMessage(`Error: ${result.error}`);
    } else {
      setSubmitMessage("Thanks for your feedback!");
      setFbSubject("");
      setFbBody("");
      setFbFeature("");
      setFbType("general");
      setShowFeedbackForm(false);
      // Refresh feedback list
      const data = await getMyFeedback();
      setMyFeedback(data as Feedback[]);
    }
    setSubmitting(false);
    setTimeout(() => setSubmitMessage(""), 4000);
  };

  const inputClass =
    "w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-16">
      <div className="pointer-events-none fixed inset-0 opacity-20" style={{ background: "radial-gradient(ellipse 60% 40% at 50% 20%, #77dffa20, transparent)" }} />

      <div className="relative z-10 mx-auto max-w-3xl">
        <CommunityNav />

        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          UPDATES
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          What&apos;s new on Creator Space + share your feedback
        </p>

        {/* Feedback CTA */}
        {!authLoading && user && (
          <div className="mt-6">
            <button
              onClick={() => setShowFeedbackForm(!showFeedbackForm)}
              className="rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:shadow-[0_0_24px_rgba(250,146,119,0.4)]"
            >
              {showFeedbackForm ? "Cancel" : "Leave Feedback"}
            </button>
          </div>
        )}

        {submitMessage && (
          <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
            {submitMessage}
          </div>
        )}

        {/* Feedback Form */}
        {showFeedbackForm && (
          <form onSubmit={handleSubmitFeedback} className="mt-4 space-y-4 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              Share Your Feedback
            </h3>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2">
              {(["bug", "feature_request", "improvement", "general"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFbType(t)}
                  className={`rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-all ${
                    fbType === t
                      ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                      : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Feature selector */}
            <select
              value={fbFeature}
              onChange={(e) => setFbFeature(e.target.value)}
              className={inputClass}
            >
              <option value="">What feature is this about? (optional)</option>
              {featureOptions.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>

            <input
              value={fbSubject}
              onChange={(e) => setFbSubject(e.target.value)}
              placeholder="Subject"
              className={inputClass}
              required
            />
            <textarea
              value={fbBody}
              onChange={(e) => setFbBody(e.target.value)}
              placeholder="Tell us what's on your mind — bugs, ideas, suggestions..."
              rows={4}
              className={inputClass}
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] disabled:opacity-50"
            >
              {submitting ? "Sending..." : "Submit Feedback"}
            </button>
          </form>
        )}

        {/* Platform Updates */}
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            Recent Updates
          </h2>
          <div className="mt-4 space-y-4">
            {loading ? (
              <p className="py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                Loading...
              </p>
            ) : updates.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-8 text-center">
                <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                  No updates yet. Check back soon!
                </p>
              </div>
            ) : (
              updates.map((update) => (
                <div
                  key={update.id}
                  className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-5"
                >
                  <div className="flex items-center gap-3">
                    {update.version && (
                      <span className="rounded-full bg-[var(--color-coral)]/10 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold text-[var(--color-coral)]">
                        {update.version}
                      </span>
                    )}
                    <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      {new Date(update.created_at).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-white)]">
                    {update.title}
                  </h3>
                  <p className="mt-1 whitespace-pre-line font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--color-mist)]">
                    {update.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* My Feedback History */}
        {user && myFeedback.length > 0 && (
          <div className="mt-10">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
              Your Feedback
            </h2>
            <div className="mt-4 space-y-3">
              {myFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]">
                      {TYPE_LABELS[fb.type] || fb.type}
                    </span>
                    {fb.feature && (
                      <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {fb.feature}
                      </span>
                    )}
                    <span
                      className="ml-auto rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold"
                      style={{ color: STATUS_COLORS[fb.status] || "var(--color-smoke)" }}
                    >
                      {fb.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                  <h3 className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                    {fb.subject}
                  </h3>
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {fb.body}
                  </p>
                  {fb.admin_response && (
                    <div className="mt-3 rounded-lg border border-[var(--color-coral)]/20 bg-[var(--color-coral)]/5 p-3">
                      <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-coral)]">
                        Admin Response
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                        {fb.admin_response}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
