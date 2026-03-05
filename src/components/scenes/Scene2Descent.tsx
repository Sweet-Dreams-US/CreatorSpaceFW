"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const WORDS = [
  { text: "PHOTOGRAPHERS", x: -15, z: -400, color: "#fa9277" },
  { text: "VIDEOGRAPHERS", x: 20, z: -900, color: "#d377fa" },
  { text: "MUSICIANS", x: -8, z: -1400, color: "#9dfa77" },
  { text: "DESIGNERS", x: 25, z: -1900, color: "#77dffa" },
  { text: "WRITERS", x: -18, z: -2400, color: "#ffece1" },
  { text: "DEVELOPERS", x: 12, z: -2900, color: "#fa9277" },
  { text: "MAKERS", x: -5, z: -3400, color: "#9dfa77" },
  { text: "DREAMERS", x: 18, z: -3900, color: "#d377fa" },
];

export default function Scene2Descent() {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !cameraRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        cameraRef.current,
        { z: 0 },
        {
          z: 4200,
          ease: "none",
          scrollTrigger: {
            trigger: containerRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1.5,
          },
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="scene-descent"
      ref={containerRef}
      className="relative bg-[var(--color-black)]"
      style={{ height: "300vh" }}
    >
      <div
        className="sticky top-0 h-screen overflow-hidden"
        style={{ perspective: "900px" }}
      >
        {/* Star field */}
        <div className="absolute inset-0">
          {Array.from({ length: 80 }).map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: Math.random() > 0.9 ? 2 : 1,
                height: Math.random() > 0.9 ? 2 : 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.4 + 0.1,
                animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>

        {/* 3D word space */}
        <div
          ref={cameraRef}
          className="absolute inset-0"
          style={{ transformStyle: "preserve-3d" }}
        >
          {WORDS.map((w) => (
            <div
              key={w.text}
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-[family-name:var(--font-display)] text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
              style={{
                transform: `translate3d(${w.x}vw, 0, ${w.z}px)`,
                color: w.color,
                textShadow: `0 0 40px ${w.color}60`,
              }}
            >
              {w.text}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
