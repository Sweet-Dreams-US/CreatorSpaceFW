"use client";

import { useState, useEffect, useRef } from "react";

interface ShareProfileProps {
  creatorName: string;
  slug: string;
}

export default function ShareProfile({ creatorName, slug }: ShareProfileProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const profileUrl = `https://creatorspacefw.com/directory/${slug}`;
  const shareText = `Check out ${creatorName} on Creator Space Fort Wayne`;

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: some browsers block clipboard in non-HTTPS
    }
  }

  function handleTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  function handleLinkedIn() {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3.5 py-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] transition-all duration-300 hover:border-[var(--color-sky)] hover:text-[var(--color-sky)]"
        aria-label="Share profile"
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
          <polyline points="16 6 12 2 8 6" />
          <line x1="12" y1="2" x2="12" y2="15" />
        </svg>
        Share
      </button>

      {open && (
        <div className="absolute right-0 top-full z-20 mt-2 w-52 overflow-hidden rounded-lg border border-white/10 bg-[var(--color-dark)] shadow-xl">
          <button
            onClick={handleCopy}
            className="flex w-full items-center gap-3 px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-colors hover:bg-[var(--color-ash)]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
            {copied ? (
              <span className="text-[var(--color-lime)]">Copied!</span>
            ) : (
              "Copy link"
            )}
          </button>
          <button
            onClick={handleTwitter}
            className="flex w-full items-center gap-3 px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-colors hover:bg-[var(--color-ash)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            Share on X
          </button>
          <button
            onClick={handleLinkedIn}
            className="flex w-full items-center gap-3 px-4 py-3 text-left font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-colors hover:bg-[var(--color-ash)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
            Share on LinkedIn
          </button>
        </div>
      )}
    </div>
  );
}
