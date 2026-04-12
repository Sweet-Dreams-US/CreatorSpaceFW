"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { gsap, ScrollTrigger } from "@/lib/gsap";
// JoinFormModal removed — signup is the single join flow now

const DISCIPLINES = [
  { text: "PHOTOGRAPHERS", color: "#fa9277" },
  { text: "VIDEOGRAPHERS", color: "#d377fa" },
  { text: "MUSICIANS", color: "#9dfa77" },
  { text: "DESIGNERS", color: "#77dffa" },
  { text: "WRITERS", color: "#ffece1" },
  { text: "DEVELOPERS", color: "#fa9277" },
  { text: "PRODUCERS", color: "#d377fa" },
  { text: "ANIMATORS", color: "#9dfa77" },
  { text: "ILLUSTRATORS", color: "#77dffa" },
  { text: "FILMMAKERS", color: "#ffece1" },
  { text: "PODCASTERS", color: "#fa9277" },
  { text: "CRAFTSMEN", color: "#9dfa77" },
];

// Three rows with different orderings
const ROW1 = [...DISCIPLINES, ...DISCIPLINES];
const ROW2 = [
  ...DISCIPLINES.slice(6),
  ...DISCIPLINES.slice(0, 6),
  ...DISCIPLINES.slice(6),
  ...DISCIPLINES.slice(0, 6),
];
const ROW3 = [
  ...DISCIPLINES.slice(3),
  ...DISCIPLINES.slice(0, 3),
  ...DISCIPLINES.slice(3),
  ...DISCIPLINES.slice(0, 3),
];

function DisciplineTag({
  text,
  color,
}: {
  text: string;
  color: string;
}) {
  return (
    <div className="flex-shrink-0 px-3">
      <span
        className="inline-block whitespace-nowrap font-[family-name:var(--font-display)] text-3xl transition-all duration-300 sm:text-4xl md:text-5xl"
        style={{
          color,
          textShadow: `0 0 30px ${color}30`,
        }}
      >
        {text}
      </span>
    </div>
  );
}

function Separator({ color }: { color: string }) {
  return (
    <div className="flex-shrink-0 px-4">
      <span
        className="inline-block text-2xl opacity-30 sm:text-3xl"
        style={{ color }}
      >
        ·
      </span>
    </div>
  );
}

export default function Scene5CommunityRiver() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".river-header", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      gsap.from(".casting-cta", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 50%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="scene-community"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--color-black)] py-24"
    >
      {/* Header */}
      <div className="river-header mb-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-smoke)]">
          Now casting
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          CALLING ALL CREATORS
        </h2>
      </div>

      {/* Marquee rows — discipline words flowing like credits */}
      <div className="relative mt-16 space-y-4">
        {/* Fade edges */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[var(--color-black)] to-transparent sm:w-40" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[var(--color-black)] to-transparent sm:w-40" />

        {/* Row 1 — flows left */}
        <div className="overflow-hidden">
          <div
            className="flex items-center"
            style={{
              animation: "river-scroll 50s linear infinite",
              width: "max-content",
            }}
          >
            {ROW1.map((d, i) => (
              <span key={`r1-${i}`} className="flex items-center">
                <DisciplineTag text={d.text} color={d.color} />
                {i < ROW1.length - 1 && (
                  <Separator color={ROW1[(i + 1) % ROW1.length].color} />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Row 2 — flows right */}
        <div className="overflow-hidden">
          <div
            className="flex items-center"
            style={{
              animation: "river-scroll 65s linear infinite reverse",
              width: "max-content",
            }}
          >
            {ROW2.map((d, i) => (
              <span key={`r2-${i}`} className="flex items-center">
                <DisciplineTag text={d.text} color={d.color} />
                {i < ROW2.length - 1 && (
                  <Separator color={ROW2[(i + 1) % ROW2.length].color} />
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Row 3 — flows left, slower */}
        <div className="overflow-hidden">
          <div
            className="flex items-center"
            style={{
              animation: "river-scroll 75s linear infinite",
              width: "max-content",
            }}
          >
            {ROW3.map((d, i) => (
              <span key={`r3-${i}`} className="flex items-center">
                <DisciplineTag text={d.text} color={d.color} />
                {i < ROW3.length - 1 && (
                  <Separator color={ROW3[(i + 1) % ROW3.length].color} />
                )}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="casting-cta mt-20 text-center">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          The roster is open.
        </p>
        <p className="mt-2 font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)] sm:text-3xl">
          ADD YOUR NAME.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/auth/signup"
            className="rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740]"
          >
            Join the Database
          </Link>
          <Link
            href="/directory"
            className="rounded-full border border-white/20 px-8 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all duration-300 hover:border-white/40 hover:text-[var(--color-white)]"
          >
            View the Database
          </Link>
        </div>
      </div>

    </section>
  );
}
