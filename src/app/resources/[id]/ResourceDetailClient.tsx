"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  requestResource,
  handleResourceRequest,
  updateResource,
} from "@/app/actions/resources";

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  slug: string | null;
}

interface ResourceRequest {
  id: string;
  creator_id: string;
  message: string | null;
  date_needed: string | null;
  date_return: string | null;
  status: string;
  created_at: string;
  creators: Creator;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export default function ResourceDetailClient({
  resourceId,
  isOwner,
  isLoggedIn,
  availability,
  requests,
}: {
  resourceId: string;
  isOwner: boolean;
  isLoggedIn: boolean;
  availability: string;
  requests: ResourceRequest[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [dateNeeded, setDateNeeded] = useState("");
  const [dateReturn, setDateReturn] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [handlingId, setHandlingId] = useState<string | null>(null);
  const [updatingAvailability, setUpdatingAvailability] = useState(false);

  async function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    const result = await requestResource(resourceId, {
      message: message.trim() || undefined,
      date_needed: dateNeeded || undefined,
      date_return: dateReturn || undefined,
    });
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setRequestSent(true);
    setMessage("");
    setDateNeeded("");
    setDateReturn("");
    router.refresh();
  }

  async function handleAction(
    requestId: string,
    status: "approved" | "declined"
  ) {
    setHandlingId(requestId);
    await handleResourceRequest(requestId, status);
    setHandlingId(null);
    router.refresh();
  }

  async function handleAvailabilityChange(newAvailability: string) {
    setUpdatingAvailability(true);
    await updateResource(resourceId, { availability: newAvailability });
    setUpdatingAvailability(false);
    router.refresh();
  }

  return (
    <div className="mt-8">
      {/* Owner view */}
      {isOwner && (
        <>
          {/* Availability controls */}
          <div className="mb-6">
            <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
              Update Availability
            </p>
            <div className="flex gap-2">
              {["available", "reserved", "unavailable"].map((status) => (
                <button
                  key={status}
                  onClick={() => handleAvailabilityChange(status)}
                  disabled={updatingAvailability || availability === status}
                  className="rounded-full px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs capitalize transition-all disabled:opacity-40"
                  style={{
                    backgroundColor:
                      availability === status
                        ? status === "available"
                          ? "#4ade80"
                          : status === "reserved"
                            ? "#facc15"
                            : "#6b7280"
                        : "var(--color-charcoal)",
                    color:
                      availability === status
                        ? "var(--color-black)"
                        : "var(--color-mist)",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Incoming requests */}
          <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            Incoming Requests ({requests.length})
          </h3>

          {requests.length === 0 ? (
            <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              No requests yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {requests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-4 transition-all duration-300 hover:border-[var(--color-coral)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                      {req.creators?.avatar_url ? (
                        <img
                          src={req.creators.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-[family-name:var(--font-display)] text-[10px] text-[var(--color-mist)]">
                          {(req.creators?.first_name?.[0] || "") +
                            (req.creators?.last_name?.[0] || "")}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <Link
                        href={
                          req.creators?.slug
                            ? `/directory/${req.creators.slug}`
                            : "#"
                        }
                        className="font-[family-name:var(--font-display)] text-sm text-[var(--color-white)] transition-colors hover:text-[var(--color-coral)]"
                      >
                        {req.creators?.first_name} {req.creators?.last_name}
                      </Link>
                      <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        {timeAgo(req.created_at)}
                      </p>
                    </div>
                    {/* Status badge */}
                    <span
                      className="rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] capitalize"
                      style={{
                        backgroundColor:
                          req.status === "pending"
                            ? "var(--color-charcoal)"
                            : req.status === "approved"
                              ? "var(--color-lime)"
                              : "var(--color-ash)",
                        color:
                          req.status === "pending"
                            ? "var(--color-mist)"
                            : req.status === "approved"
                              ? "var(--color-black)"
                              : "var(--color-smoke)",
                      }}
                    >
                      {req.status}
                    </span>
                  </div>

                  {req.message && (
                    <p className="mt-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] leading-relaxed">
                      {req.message}
                    </p>
                  )}

                  {/* Dates */}
                  {(req.date_needed || req.date_return) && (
                    <div className="mt-3 flex gap-4">
                      {req.date_needed && (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]">
                          Needed:{" "}
                          {new Date(req.date_needed).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                      {req.date_return && (
                        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-violet)]">
                          Return:{" "}
                          {new Date(req.date_return).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  {req.status === "pending" && (
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleAction(req.id, "approved")}
                        disabled={handlingId === req.id}
                        className="rounded-full border border-[var(--color-lime)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)] transition-all hover:bg-[var(--color-lime)] hover:text-[var(--color-black)] disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(req.id, "declined")}
                        disabled={handlingId === req.id}
                        className="rounded-full border border-[var(--color-smoke)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:bg-[var(--color-smoke)] hover:text-[var(--color-black)] disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Non-owner view: request form */}
      {!isOwner && isLoggedIn && availability === "available" && (
        <>
          {requestSent ? (
            <div className="rounded-xl border border-[var(--color-lime)]/20 bg-[var(--color-dark)] p-6 text-center">
              <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-lime)]">
                Request Sent
              </p>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                The owner will review your request and get back to you.
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
              <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                Request This Resource
              </h3>
              <form onSubmit={handleRequest} className="mt-4 space-y-4">
                <textarea
                  placeholder="Tell the owner why you need this..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] resize-none"
                />

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                      Date Needed
                    </label>
                    <input
                      type="date"
                      value={dateNeeded}
                      onChange={(e) => setDateNeeded(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                      Date Return
                    </label>
                    <input
                      type="date"
                      value={dateReturn}
                      onChange={(e) => setDateReturn(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                    />
                  </div>
                </div>

                {error && (
                  <p className="font-[family-name:var(--font-mono)] text-xs text-red-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </form>
            </div>
          )}
        </>
      )}

      {/* Resource not available */}
      {!isOwner && isLoggedIn && availability !== "available" && (
        <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 text-center">
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            This resource is currently{" "}
            <span className="capitalize text-[var(--color-mist)]">
              {availability}
            </span>
            .
          </p>
        </div>
      )}

      {/* Not logged in */}
      {!isLoggedIn && (
        <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6 text-center">
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Sign in to request this resource.
          </p>
          <Link
            href="/auth/login"
            className="mt-4 inline-block rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
          >
            Sign In
          </Link>
        </div>
      )}
    </div>
  );
}
