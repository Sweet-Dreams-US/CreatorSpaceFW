"use client";

import { useEffect, useState, useRef } from "react";

const SECTIONS = [
  { label: "Home — The Arrival", id: "scene-arrival", key: "arrival" },
  { label: "Free Meetups", id: "scene-landing", key: "landing" },
  { label: "Next Event", id: "scene-event", key: "event" },
  { label: "The Creators", id: "scene-community", key: "community" },
  { label: "Constellation", id: "scene-constellation", key: "constellation" },
  { label: "Close", id: "scene-close", key: "close" },
];

const PAGES = [
  { label: "Creator Directory", href: "/directory", key: "directory" },
  { label: "Design System", href: "/design-system", key: "design" },
];

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const allItems = [
    ...SECTIONS.map((s) => ({ ...s, type: "section" as const })),
    ...PAGES.map((p) => ({ ...p, type: "page" as const, id: "" })),
  ];

  const filtered = allItems.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Open on / or Cmd+K
      if (
        (e.key === "/" && !open && !(e.target instanceof HTMLInputElement)) ||
        (e.key === "k" && (e.metaKey || e.ctrlKey))
      ) {
        e.preventDefault();
        setOpen(true);
        setQuery("");
        setSelectedIdx(0);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const navigate = (item: (typeof allItems)[number]) => {
    setOpen(false);
    if (item.type === "page" && "href" in item) {
      window.location.href = item.href;
    } else if (item.id) {
      document.getElementById(item.id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx((i) => (i + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx((i) => (i - 1 + filtered.length) % filtered.length);
    } else if (e.key === "Enter" && filtered[selectedIdx]) {
      navigate(filtered[selectedIdx]);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 pt-[20vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-white/10 bg-[var(--color-dark)] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-white/5 px-4 py-3">
          <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
            /
          </span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIdx(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Jump to..."
            className="flex-1 bg-transparent font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-ash)]"
          />
          <kbd className="rounded bg-[var(--color-charcoal)] px-1.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-64 overflow-y-auto py-2">
          {filtered.map((item, i) => (
            <button
              key={item.key}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                i === selectedIdx
                  ? "bg-[var(--color-charcoal)] text-[var(--color-white)]"
                  : "text-[var(--color-mist)] hover:bg-[var(--color-charcoal)]"
              }`}
              onClick={() => navigate(item)}
              onMouseEnter={() => setSelectedIdx(i)}
            >
              <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                {item.type === "page" ? "PAGE" : "§"}
              </span>
              <span className="font-[family-name:var(--font-mono)] text-sm">
                {item.label}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="px-4 py-6 text-center font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              No results
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
