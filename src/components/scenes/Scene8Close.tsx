"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

export default function Scene8Close() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [konamiTriggered, setKonamiTriggered] = useState(false);
  const hasTyped = useRef(false);

  // Typewriter effect triggered by scroll
  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 60%",
        onEnter: () => {
          if (hasTyped.current || !textRef.current) return;
          hasTyped.current = true;
          const text = "SEE YOU THERE";
          let i = 0;
          textRef.current.textContent = "";
          const interval = setInterval(() => {
            if (i < text.length && textRef.current) {
              textRef.current.textContent += text[i];
              i++;
            } else {
              clearInterval(interval);
            }
          }, 100);
        },
      });

      gsap.from(".close-fade", {
        y: 20,
        opacity: 0,
        stagger: 0.1,
        duration: 0.6,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 40%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Konami code
  useEffect(() => {
    const code = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "KeyB", "KeyA",
    ];
    let idx = 0;

    const onKey = (e: KeyboardEvent) => {
      if (e.code === code[idx]) {
        idx++;
        if (idx === code.length) {
          setKonamiTriggered(true);
          idx = 0;
        }
      } else {
        idx = 0;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <section
      id="scene-close"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--color-black)]"
    >
      {/* Warm gradient background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, #fa927720, transparent)",
        }}
      />

      <div className="relative z-10 flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
        {/* Typewriter */}
        <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl md:text-8xl">
          <span ref={textRef} />
          <span className="animate-pulse text-[var(--color-coral)]">_</span>
        </p>

        <p className="close-fade mt-8 font-[family-name:var(--font-mono)] text-xs tracking-[0.25em] text-[var(--color-smoke)]">
          FORT WAYNE · ALWAYS FREE
        </p>
      </div>

      {/* Footer */}
      <footer className="relative z-10 bg-[var(--color-coral)] px-10 py-12 sm:px-16 md:px-24 lg:px-32">
        {/* Single row: logo — socials — newsletter — logo */}
        <div className="flex w-full flex-col items-center gap-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          {/* Creator Space logo — left edge */}
          <div className="close-fade shrink-0">
            <img
              src="https://eymjahxzesuoahpwzifq.supabase.co/storage/v1/object/public/Media/Logos/Creator_Space_logo_black.png"
              alt="Creator Space"
              className="h-16 w-auto sm:h-20"
            />
          </div>

          {/* Social links */}
          <div className="close-fade flex shrink-0 gap-5">
            <a
              href="https://www.instagram.com/creatorspace_fw/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-black)] opacity-60 transition-opacity duration-300 hover:opacity-100"
              aria-label="Instagram"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
            <a
              href="https://www.facebook.com/CreatorSpaceFW"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--color-black)] opacity-60 transition-opacity duration-300 hover:opacity-100"
              aria-label="Facebook"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </a>
          </div>

          {/* Newsletter */}
          <div className="close-fade flex shrink-0 items-center gap-3">
            <p className="font-[family-name:var(--font-mono)] text-sm uppercase tracking-widest text-[var(--color-black)]/70">
              Stay in the loop
            </p>
            <input
              type="email"
              placeholder="your@email.com"
              className="w-56 border-b-2 border-[var(--color-black)]/30 bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-black)] outline-none placeholder:text-[var(--color-black)]/40 focus:border-[var(--color-black)]"
            />
            <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-black)] text-sm text-[var(--color-coral)] transition-transform hover:scale-110">
              →
            </button>
          </div>

          {/* Created by Sweet Dreams — right edge */}
          <div className="close-fade flex shrink-0 items-center gap-3">
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-black)]/50">
              Created by:
            </span>
            <a
              href="https://sweetdreams.us/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="https://eymjahxzesuoahpwzifq.supabase.co/storage/v1/object/public/Media/Logos/SweetDreamsUSlogowide.png"
                alt="Sweet Dreams"
                className="h-14 w-auto transition-opacity hover:opacity-80 sm:h-16"
              />
            </a>
          </div>
        </div>
      </footer>

      {/* Konami Easter Egg */}
      {konamiTriggered && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-black)]/90 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-6 text-6xl">🎆</div>
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-coral)]">
              YOU FOUND THE SECRET.
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
              You&apos;re definitely a creator.
            </p>
            <button
              onClick={() => setKonamiTriggered(false)}
              className="mt-6 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] underline underline-offset-4"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
