"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { sendConnectionRequest, getConnectionStatus, respondToConnection } from "@/app/actions/connections";

interface ConnectButtonProps {
  targetCreatorId: string;
  currentUserId?: string | null;
  currentCreatorId?: string | null;
}

export default function ConnectButton({
  targetCreatorId,
  currentUserId,
  currentCreatorId,
}: ConnectButtonProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [iAmReceiver, setIAmReceiver] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentCreatorId) {
      setLoading(false);
      return;
    }

    async function checkStatus() {
      const result = await getConnectionStatus(currentCreatorId!, targetCreatorId);
      if (result) {
        setStatus(result.status);
        setConnectionId(result.id);
        // Check if the current user is the RECEIVER of this connection
        setIAmReceiver(result.to_creator_id === currentCreatorId);
      }
      setLoading(false);
    }

    checkStatus();
  }, [currentCreatorId, targetCreatorId]);

  useEffect(() => {
    if (!showModal) return;
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setShowModal(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showModal]);

  if (!currentUserId) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all duration-300 hover:bg-[var(--color-coral)] hover:text-[var(--color-black)]"
      >
        Sign in to connect
      </Link>
    );
  }

  if (currentCreatorId === targetCreatorId) return null;
  if (loading) {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-ash)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        ...
      </span>
    );
  }

  if (status === "accepted") {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/5 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
        Connected
      </span>
    );
  }

  if (status === "declined") {
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-smoke)]/20 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Request Declined
      </span>
    );
  }

  // Pending — show different UI depending on direction
  if (status === "pending") {
    if (iAmReceiver && connectionId) {
      // I received this request — show Accept/Decline
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setSending(true);
              const result = await respondToConnection(connectionId, "accepted");
              if (result.error) {
                setSending(false);
                return;
              }
              setStatus("accepted");
              setSending(false);
            }}
            disabled={sending}
            className="rounded-full bg-[var(--color-lime)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:shadow-[0_0_16px_rgba(157,250,119,0.3)] disabled:opacity-50"
          >
            Accept
          </button>
          <button
            onClick={async () => {
              setSending(true);
              await respondToConnection(connectionId, "declined");
              setStatus("declined");
              setSending(false);
            }}
            disabled={sending}
            className="rounded-full border border-[var(--color-ash)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-red-400 hover:text-red-400 disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      );
    }

    // I sent this request — show waiting state
    return (
      <span className="inline-flex items-center rounded-full border border-[var(--color-smoke)]/20 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Request Sent
      </span>
    );
  }

  // No connection yet — show Connect button
  async function handleSend() {
    setSending(true);
    const result = await sendConnectionRequest(targetCreatorId, message);
    setSending(false);
    if (result.success) {
      setStatus("pending");
      setIAmReceiver(false);
      setShowModal(false);
      setMessage("");
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowModal(true)}
        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-coral)] px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all duration-300 hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] hover:shadow-[0_0_20px_rgba(250,146,119,0.2)]"
      >
        Connect
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div
            ref={modalRef}
            className="mx-4 w-full max-w-sm rounded-xl border border-white/10 bg-[var(--color-dark)] p-6 shadow-2xl"
          >
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              Send Connection Request
            </h3>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Add an optional message to introduce yourself.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey, I'd love to connect..."
              rows={3}
              className="mt-4 w-full resize-none rounded-lg border border-[var(--color-ash)] bg-[var(--color-black)] p-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] transition-colors focus:border-[var(--color-coral)]"
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-full border border-white/10 py-2.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-white/20"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending}
                className="flex-1 rounded-full bg-[var(--color-coral)] py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(250,146,119,0.3)] disabled:opacity-50"
              >
                {sending ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
