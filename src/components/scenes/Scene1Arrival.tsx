"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

// Brand colors
const COLORS = ["#fa9277", "#9dfa77", "#77dffa", "#d377fa", "#ffece1"];

// Seeded PRNG for deterministic SSR
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const _r = seededRandom(42);
const STARS = Array.from({ length: 60 }, () => {
  const dur = _r() * 3 + 2;
  const delay = _r() * 3;
  return {
    w: _r() > 0.9 ? 2 : 1,
    h: _r() > 0.9 ? 2 : 1,
    left: _r() * 100,
    top: _r() * 100,
    opacity: _r() * 0.4 + 0.1,
    anim: `twinkle ${dur}s ${delay}s ease-in-out infinite`,
  };
});

// Creator types
const CREATOR_TYPES = [
  { text: "PHOTOGRAPHERS", color: "#fa9277" },
  { text: "VIDEOGRAPHERS", color: "#77dffa" },
  { text: "MUSICIANS", color: "#d377fa" },
  { text: "DESIGNERS", color: "#9dfa77" },
  { text: "WRITERS", color: "#ffece1" },
  { text: "DEVELOPERS", color: "#77dffa" },
  { text: "PRODUCERS", color: "#fa9277" },
  { text: "ANIMATORS", color: "#d377fa" },
  { text: "FILMMAKERS", color: "#9dfa77" },
  { text: "PODCASTERS", color: "#ffece1" },
  { text: "DREAMERS", color: "#fa9277" },
  { text: "MAKERS", color: "#77dffa" },
];

// Position words in 3D tunnel
const _rw = seededRandom(777);
const TUNNEL_WORDS = CREATOR_TYPES.map((ct, i) => ({
  ...ct,
  x: (_rw() - 0.5) * 30,
  y: (_rw() - 0.5) * 20,
  z: -(i + 1) * 1000,
  rotate: (_rw() - 0.5) * 6,
  scale: 0.8 + _rw() * 0.4,
}));

const TUNNEL_DEPTH = (CREATOR_TYPES.length + 1) * 1000;

// Pre-generate disco tiles for SSR — big grid that fills the whole screen
const _rd = seededRandom(999);
const GRID_COLS = 14;
const GRID_ROWS = 9;
const DISCO_TILES = Array.from({ length: GRID_COLS * GRID_ROWS }, () => {
  const active = _rd() > 0.55;
  const delay = _rd() * 4;
  const dur = 1.5 + _rd() * 2.5;
  const maxOp = active ? 0.12 + _rd() * 0.35 : 0;
  return {
    active,
    color: COLORS[Math.floor(_rd() * COLORS.length)],
    // Pre-bake full animation string to avoid shorthand/longhand conflict
    anim: active ? `disco-pulse ${dur}s ${delay}s ease-in-out infinite` : "none",
    maxOpacity: maxOp,
  };
});

const TITLE_LETTERS = "CREATOR SPACE".split("");
const SUB_LETTERS = "FORT WAYNE".split("");

export default function Scene1Arrival() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const titleContentRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);
  const tunnelLayerRef = useRef<HTMLDivElement>(null);
  const discoRef = useRef<HTMLDivElement>(null);
  const scrollPromptRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  // Reveal on mount
  useEffect(() => {
    const timer = setTimeout(() => setRevealed(true), 800);
    return () => clearTimeout(timer);
  }, []);

  // Single pinned section: title → fly-through → fade out
  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !titleContentRef.current || !cameraRef.current || !tunnelLayerRef.current || !discoRef.current) return;

    const ctx = gsap.context(() => {
      const master = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
          pin: false,
        },
      });

      // Phase 1 (0-20%): Title zooms through viewer, tunnel words become visible
      master.to(titleContentRef.current, {
        scale: 14,
        opacity: 0,
        ease: "power2.in",
        duration: 20,
      }, 0);

      // Phase 2 (15-85%): Camera flies through the 3D word tunnel
      master.fromTo(cameraRef.current,
        { z: 0 },
        { z: TUNNEL_DEPTH, ease: "power1.inOut", duration: 70 },
        15,
      );

      // Show tunnel layer as title fades
      master.fromTo(tunnelLayerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 10 },
        10,
      );

      // Phase 3 (80-100%): Everything fades, disco grid fades down
      master.to(tunnelLayerRef.current, {
        opacity: 0,
        duration: 15,
      }, 80);

      master.to(discoRef.current, {
        opacity: 0,
        duration: 20,
      }, 80);

      // Hide scroll prompt immediately
      master.to(scrollPromptRef.current, {
        opacity: 0,
        duration: 3,
      }, 0);

    }, section);

    return () => ctx.revert();
  }, []);

  // Letter-level mouse glow
  useEffect(() => {
    const container = titleRef.current;
    if (!container) return;
    const onMove = (e: MouseEvent) => {
      const letters = container.querySelectorAll<HTMLSpanElement>("[data-letter]");
      letters.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dist = Math.sqrt((e.clientX - cx) ** 2 + (e.clientY - cy) ** 2);
        const proximity = Math.max(0, 1 - dist / 250);
        el.style.setProperty("--glow", String(proximity));
      });
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  return (
    <section
      id="scene-arrival"
      ref={sectionRef}
      className="relative bg-[var(--color-black)]"
      style={{ height: "500vh" }}
    >
      <style>{`
        @keyframes disco-pulse {
          0%, 100% { opacity: 0; }
          50% { opacity: var(--max-opacity, 0.3); }
        }
        @keyframes letter-in {
          0% { opacity: 0; transform: translateY(30px) scale(0.5) rotateX(90deg); filter: blur(8px); }
          60% { opacity: 1; transform: translateY(-5px) scale(1.05) rotateX(-5deg); filter: blur(0px); }
          100% { opacity: 1; transform: translateY(0) scale(1) rotateX(0deg); filter: blur(0px); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes color-cycle {
          0%   { color: #fa9277; text-shadow: 0 0 30px #fa927760, 0 0 60px #fa927730; }
          20%  { color: #9dfa77; text-shadow: 0 0 30px #9dfa7760, 0 0 60px #9dfa7730; }
          40%  { color: #77dffa; text-shadow: 0 0 30px #77dffa60, 0 0 60px #77dffa30; }
          60%  { color: #d377fa; text-shadow: 0 0 30px #d377fa60, 0 0 60px #d377fa30; }
          80%  { color: #ffece1; text-shadow: 0 0 30px #ffece160, 0 0 60px #ffece130; }
          100% { color: #fa9277; text-shadow: 0 0 30px #fa927760, 0 0 60px #fa927730; }
        }
        @keyframes sub-glow {
          0%, 100% { opacity: 0.6; letter-spacing: 0.3em; }
          50% { opacity: 1; letter-spacing: 0.5em; }
        }
        @keyframes floor-reflect {
          0%, 100% { opacity: 0.08; }
          50% { opacity: 0.2; }
        }
        [data-letter] {
          transition: text-shadow 0.15s ease;
          text-shadow:
            0 0 calc(20px + var(--glow, 0) * 40px) currentColor,
            0 0 calc(40px + var(--glow, 0) * 80px) currentColor;
        }
      `}</style>

      {/* Sticky viewport — everything lives here */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* === LAYER 0: Stars === */}
        <div className="absolute inset-0">
          {STARS.map((star, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: star.w,
                height: star.h,
                left: `${star.left}%`,
                top: `${star.top}%`,
                opacity: star.opacity,
                animation: star.anim,
              }}
            />
          ))}
        </div>

        {/* === LAYER 1: Disco grid — persistent backdrop through everything === */}
        <div
          ref={discoRef}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div
            className="grid pointer-events-none"
            style={{
              gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
              gap: "3px",
              width: "100vw",
              height: "100vh",
              padding: "2vh 2vw",
            }}
          >
            {DISCO_TILES.map((tile, i) => (
              <div
                key={i}
                className="rounded-sm"
                style={{
                  backgroundColor: tile.color,
                  opacity: 0,
                  animation: revealed ? tile.anim : "none",
                  ["--max-opacity" as string]: tile.maxOpacity,
                }}
              />
            ))}
          </div>
        </div>

        {/* === LAYER 2: 3D word tunnel — flies through on scroll === */}
        <div
          ref={tunnelLayerRef}
          className="absolute inset-0"
          style={{ opacity: 0, perspective: "800px", perspectiveOrigin: "50% 50%" }}
        >
          {/* Vignette for depth */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%)",
            }}
          />

          {/* Camera rig */}
          <div
            ref={cameraRef}
            className="absolute inset-0"
            style={{ transformStyle: "preserve-3d", willChange: "transform" }}
          >
            {TUNNEL_WORDS.map((w) => (
              <div
                key={w.text}
                className="absolute left-1/2 top-1/2 whitespace-nowrap font-[family-name:var(--font-display)]"
                style={{
                  transform: `translate(-50%, -50%) translate3d(${w.x}vw, ${w.y}vh, ${w.z}px) rotate(${w.rotate}deg) scale(${w.scale})`,
                  fontSize: "clamp(2.5rem, 7vw, 7rem)",
                  color: w.color,
                  textShadow: `0 0 30px ${w.color}60, 0 0 60px ${w.color}30, 0 0 100px ${w.color}15`,
                  backfaceVisibility: "hidden",
                }}
              >
                {w.text}
              </div>
            ))}
          </div>
        </div>

        {/* === LAYER 3: Title — on top, zooms through === */}
        <div
          ref={titleContentRef}
          className="absolute inset-0 z-20 flex items-center justify-center bg-[var(--color-black)]/80"
          style={{ transformOrigin: "center center", willChange: "transform, opacity" }}
        >
          {/* Radial glow behind title */}
          <div
            className="absolute pointer-events-none"
            style={{
              width: "min(100vw, 1000px)",
              height: "min(60vh, 500px)",
              background: "radial-gradient(ellipse at center, rgba(250,146,119,0.12) 0%, rgba(211,119,250,0.08) 30%, transparent 70%)",
              animation: revealed ? "floor-reflect 4s ease-in-out infinite" : "none",
            }}
          />

          {/* Title text */}
          <div ref={titleRef} className="relative text-center" style={{ perspective: "800px" }}>
            <h1
              className="font-[family-name:var(--font-display)] leading-none"
              style={{ fontSize: "clamp(3rem, 12vw, 150px)" }}
            >
              {TITLE_LETTERS.map((char, i) => (
                <span
                  key={i}
                  data-letter
                  className="inline-block"
                  style={{
                    animation: revealed
                      ? `letter-in 0.8s ${i * 0.06}s cubic-bezier(0.16,1,0.3,1) both, color-cycle ${5 + (i % 3)}s ${i * 0.4}s linear infinite`
                      : "none",
                    opacity: revealed ? undefined : 0,
                    minWidth: char === " " ? "0.3em" : undefined,
                  }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </h1>

            <p
              className="font-[family-name:var(--font-mono)] mt-2 tracking-[0.3em] text-[var(--color-smoke)]"
              style={{
                fontSize: "clamp(0.8rem, 3vw, 2.5rem)",
                animation: revealed ? `sub-glow 4s ease-in-out infinite` : "none",
                opacity: revealed ? undefined : 0,
              }}
            >
              {SUB_LETTERS.map((char, i) => {
                const d = TITLE_LETTERS.length * 0.06 + 0.2 + i * 0.04;
                return (
                  <span
                    key={i}
                    className="inline-block"
                    style={{
                      animation: revealed
                        ? `letter-in 0.6s ${d}s cubic-bezier(0.16,1,0.3,1) both`
                        : "none",
                      opacity: revealed ? undefined : 0,
                      minWidth: char === " " ? "0.25em" : undefined,
                    }}
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                );
              })}
            </p>

            {/* Shimmer line */}
            <div
              className="mx-auto mt-4"
              style={{
                width: "min(80vw, 700px)",
                height: "2px",
                background: "linear-gradient(90deg, transparent, #fa927700, #fa9277, #77dffa, #d377fa, #9dfa77, #fa927700, transparent)",
                backgroundSize: "200% 100%",
                animation: revealed ? "shimmer 3s linear infinite" : "none",
                opacity: revealed ? 0.6 : 0,
                transition: `opacity 1s ${TITLE_LETTERS.length * 0.06 + 0.8}s ease`,
              }}
            />
          </div>
        </div>

        {/* Scroll prompt */}
        <div
          ref={scrollPromptRef}
          className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2 animate-bounce opacity-30"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--color-smoke)]">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </div>
    </section>
  );
}
