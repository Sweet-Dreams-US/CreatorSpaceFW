"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const POLAROIDS = [
  { id: 1, color: "#fa9277", rotation: -6, caption: "Kick-Off Night" },
  { id: 2, color: "#d377fa", rotation: 4, caption: "Portfolio Reviews" },
  { id: 3, color: "#9dfa77", rotation: -3, caption: "Live Music Set" },
  { id: 4, color: "#77dffa", rotation: 7, caption: "Design Workshop" },
  { id: 5, color: "#ffece1", rotation: -5, caption: "Community Dinner" },
  { id: 6, color: "#fa9277", rotation: 2, caption: "Photo Walk" },
];

export default function Scene7Proof() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [picked, setPicked] = useState<number | null>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".proof-content", {
        y: 50,
        opacity: 0,
        stagger: 0.12,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 60%",
        },
      });
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      id="scene-proof"
      ref={sectionRef}
      className="relative min-h-screen overflow-hidden bg-[var(--color-black)] py-24"
    >
      <div className="mx-auto grid max-w-6xl gap-12 px-6 md:grid-cols-2 md:items-center md:gap-16 lg:px-12">
        {/* Left: Polaroid stack */}
        <div className="proof-content relative mx-auto h-[400px] w-full max-w-md">
          {POLAROIDS.map((p, i) => (
            <div
              key={p.id}
              className="absolute cursor-pointer rounded-sm bg-[var(--color-white)] p-2 shadow-2xl transition-all duration-500"
              style={{
                width: 200,
                left: `${10 + (i % 3) * 25}%`,
                top: `${5 + Math.floor(i / 3) * 35}%`,
                transform:
                  picked === p.id
                    ? "rotate(0deg) scale(1.3) translateY(-20px)"
                    : `rotate(${p.rotation}deg) scale(1)`,
                zIndex: picked === p.id ? 50 : POLAROIDS.length - i,
                filter: picked !== null && picked !== p.id ? "brightness(0.5)" : "none",
              }}
              onMouseEnter={() => setPicked(p.id)}
              onMouseLeave={() => setPicked(null)}
            >
              {/* Placeholder image */}
              <div
                className="aspect-square w-full"
                style={{
                  background: `linear-gradient(135deg, ${p.color}40, ${p.color}20)`,
                }}
              />
              <p className="mt-1 text-center font-[family-name:var(--font-mono)] text-[9px] text-[var(--color-black)]">
                {p.caption}
              </p>
            </div>
          ))}
        </div>

        {/* Right: Merch + message */}
        <div className="proof-content text-center md:text-left">
          {/* Merch placeholder - spinning gradient orb */}
          <div className="relative mx-auto mb-8 h-48 w-48 md:mx-0">
            <div
              className="h-full w-full rounded-2xl"
              style={{
                background: "linear-gradient(135deg, #fa9277, #d377fa, #77dffa)",
                backgroundSize: "200% 200%",
                animation: "gradient-shift 5s ease infinite",
              }}
            />
            <p className="absolute inset-0 flex items-center justify-center font-[family-name:var(--font-display)] text-2xl text-[var(--color-black)]">
              MERCH
            </p>
          </div>

          <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)] sm:text-4xl">
            100% OF MERCH PROFITS GO BACK TO{" "}
            <span className="text-[var(--color-coral)]">CREATORS.</span>
          </p>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            NOT SOME. ALL.
          </p>

          <button className="mt-8 rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_#fa927780]">
            Shop the Collab →
          </button>
        </div>
      </div>
    </section>
  );
}
