"use client";

import { useEffect, useRef, useState } from "react";

export interface TocSection {
  id: string;
  text: string;
}

/**
 * Table of contents and reading progress for a blog post.
 *
 * Desktop (1024px and wider): a small panel fixed in the bottom right corner,
 * with a progress bar and the section list, the current section marked.
 *
 * Mobile: a bar fixed to the bottom of the screen showing the current section
 * and an arrow. The arrow opens the full list above the bar. Tapping a section
 * jumps to it and closes the list.
 *
 * Progress is measured against the article body (#post-body), so it reads 0
 * at the first word and 100 at the last, whatever sits above or below it.
 */
export default function BlogToc({ sections }: { sections: TocSection[] }) {
  const [activeId, setActiveId] = useState("");
  const [progress, setProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const barRef = useRef<HTMLDivElement>(null);
  const raf = useRef<number | null>(null);

  // Other fixed elements at the bottom of the screen (the feedback button)
  // read --blog-bar-offset to stay above this bar on small screens.
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const root = document.documentElement;
    const update = () => {
      const small = window.matchMedia("(max-width: 1023px)").matches;
      root.style.setProperty("--blog-bar-offset", small ? `${bar.getBoundingClientRect().height}px` : "0px");
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(bar);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
      root.style.removeProperty("--blog-bar-offset");
    };
  }, []);

  useEffect(() => {
    if (sections.length === 0) return;

    const measure = () => {
      const article = document.getElementById("post-body");
      if (article) {
        const rect = article.getBoundingClientRect();
        const total = rect.height - window.innerHeight * 0.6;
        const pct = total > 0 ? (-rect.top / total) * 100 : rect.top <= 0 ? 100 : 0;
        setProgress(Math.min(100, Math.max(0, pct)));
      }

      const lineY = 140; // a heading counts as current once it passes this line
      let current = "";
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top - lineY <= 0) current = s.id;
      }
      setActiveId(current);
    };

    const onScroll = () => {
      if (raf.current !== null) return;
      raf.current = requestAnimationFrame(() => {
        raf.current = null;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [sections]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (sections.length === 0) return null;

  const goTo = (id: string) => {
    setOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const activeText = sections.find((s) => s.id === activeId)?.text ?? "Contents";
  const pct = Math.round(progress);

  return (
    <>
      {/* Desktop: small panel in the corner */}
      <aside
        aria-label="Contents"
        className="fixed bottom-24 right-6 z-30 hidden w-60 overflow-hidden rounded-xl border border-white/10 bg-[var(--color-dark)]/95 shadow-2xl backdrop-blur-md lg:block"
      >
        <div
          className="h-[3px] w-full bg-[var(--color-ash)]"
          role="progressbar"
          aria-label="Reading progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
        >
          <div className="h-full bg-[var(--color-coral)] transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
        <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-4">
          <div className="flex items-center justify-between font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-smoke)]">
            <span>Contents</span>
            <span>{pct}%</span>
          </div>
          <nav className="mt-3 space-y-2.5">
            {sections.map((s) => {
              const current = s.id === activeId;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goTo(s.id)}
                  aria-current={current ? "location" : undefined}
                  className={`flex w-full items-start gap-2.5 text-left font-[family-name:var(--font-mono)] text-xs leading-snug transition-colors ${
                    current ? "text-[var(--color-coral)]" : "text-[var(--color-smoke)] hover:text-[var(--color-white)]"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-[5px] block shrink-0 rounded-full transition-all duration-300 ${
                      current
                        ? "h-2 w-2 bg-[var(--color-coral)] shadow-[0_0_8px_#fa9277]"
                        : "h-1.5 w-1.5 bg-[var(--color-ash)]"
                    }`}
                  />
                  <span>{s.text}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Mobile: bar fixed to the bottom, the full list opens above it */}
      <div ref={barRef} className="fixed inset-x-0 bottom-0 z-[95] lg:hidden">
        {open && (
          <>
            <button
              type="button"
              aria-label="Close contents"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 -z-10 cursor-default bg-[var(--color-black)]/60"
            />
            <nav
              aria-label="Contents"
              className="max-h-[55vh] overflow-y-auto border-x border-t border-white/10 bg-[var(--color-dark)] px-5 py-2 shadow-[0_-18px_44px_-22px_rgba(0,0,0,0.8)]"
            >
              {sections.map((s) => {
                const current = s.id === activeId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => goTo(s.id)}
                    aria-current={current ? "location" : undefined}
                    className={`flex w-full items-start gap-3 border-b border-white/5 py-3 text-left font-[family-name:var(--font-mono)] text-[13px] leading-snug last:border-b-0 ${
                      current ? "text-[var(--color-coral)]" : "text-[var(--color-mist)]"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`mt-[5px] block h-1.5 w-1.5 shrink-0 rounded-full ${
                        current ? "bg-[var(--color-coral)] shadow-[0_0_8px_#fa9277]" : "bg-[var(--color-ash)]"
                      }`}
                    />
                    <span>{s.text}</span>
                  </button>
                );
              })}
            </nav>
          </>
        )}
        <div className="h-[3px] w-full bg-[var(--color-ash)]">
          <div className="h-full bg-[var(--color-coral)] transition-[width] duration-150" style={{ width: `${progress}%` }} />
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close contents" : "Open contents"}
          className="flex w-full items-center gap-3 border-t border-white/10 bg-[var(--color-dark)]/95 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-md"
        >
          <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-coral)]">
            {pct}%
          </span>
          <span className="min-w-0 flex-1 truncate text-left font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)]">
            {activeText}
          </span>
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`shrink-0 text-[var(--color-smoke)] transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
      </div>
    </>
  );
}
