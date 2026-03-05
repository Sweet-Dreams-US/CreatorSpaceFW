"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useAuth } from "@/components/providers/AuthProvider";
import { rsvpToEvent, checkRsvp } from "@/app/actions/rsvp";

// Current event config — update this for each new event
const CURRENT_EVENT = {
  id: "2026-03",
  title: "MEETUP #2",
  date: "MARCH 26TH",
  time: "6:00 PM",
  venue: "CINEMA CENTER",
};

// Seeded PRNG for deterministic rendering
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const _r = seededRandom(999);
const CONFETTI = Array.from({ length: 30 }, () => ({
  left: _r() * 100,
  top: _r() * 100,
  size: 2 + _r() * 4,
  color: ["#fa9277", "#9dfa77", "#77dffa", "#d377fa", "#ffece1"][
    Math.floor(_r() * 5)
  ],
  dur: 4 + _r() * 6,
  delay: _r() * 5,
  rotation: _r() * 360,
}));

export default function Scene4NextEvent() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCurtain = useRef<HTMLDivElement>(null);
  const rightCurtain = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [reelSpin, setReelSpin] = useState(false);
  const [rsvpState, setRsvpState] = useState<
    "idle" | "loading" | "done" | "already"
  >("idle");
  const { user, loading: authLoading } = useAuth();

  // Check if user already RSVP'd
  useEffect(() => {
    if (!user) return;
    checkRsvp(user.id, CURRENT_EVENT.id).then(({ hasRsvpd }) => {
      if (hasRsvpd) setRsvpState("already");
    });
  }, [user]);

  const handleRsvp = useCallback(async () => {
    if (!user) {
      window.location.href = "/auth/login?next=/#scene-event";
      return;
    }

    setRsvpState("loading");
    const result = await rsvpToEvent(user.id, CURRENT_EVENT.id);

    if (result.success) {
      setRsvpState(result.alreadyRsvpd ? "already" : "done");
    } else {
      setRsvpState("idle");
    }
  }, [user]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      const master = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
          toggleActions: "play none none none",
        },
      });

      master
        .to(
          leftCurtain.current,
          { x: "-105%", duration: 1.4, ease: "power3.inOut" },
          "-=0.3"
        )
        .to(
          rightCurtain.current,
          { x: "105%", duration: 1.4, ease: "power3.inOut" },
          "<"
        );

      // Content reveals with stagger
      master.from(
        ".event-reveal",
        {
          y: 40,
          opacity: 0,
          stagger: 0.1,
          duration: 0.7,
          ease: "power2.out",
        },
        "-=0.5"
      );
    }, sectionRef);

    // Spotlight follows cursor
    const onMove = (e: MouseEvent) => {
      if (!spotlightRef.current || !sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      spotlightRef.current.style.background = `radial-gradient(circle 400px at ${x}px ${y}px, rgba(0,0,0,0.06), transparent 70%)`;
    };

    sectionRef.current.addEventListener("mousemove", onMove);
    const el = sectionRef.current;

    return () => {
      ctx.revert();
      el.removeEventListener("mousemove", onMove);
    };
  }, []);

  const handleNeonHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    gsap
      .timeline()
      .to(btn, { opacity: 0.3, duration: 0.05 })
      .to(btn, { opacity: 1, duration: 0.05 })
      .to(btn, { opacity: 0.4, duration: 0.04 })
      .to(btn, { opacity: 1, duration: 0.06 });
  };

  const rsvpLabel = () => {
    if (authLoading) return "RSVP →";
    if (rsvpState === "loading") return "SAVING...";
    if (rsvpState === "done" || rsvpState === "already") return "YOU'RE IN ✓";
    if (!user) return "SIGN IN TO RSVP →";
    return "RSVP →";
  };

  const rsvpDisabled =
    rsvpState === "done" || rsvpState === "already" || rsvpState === "loading";

  return (
    <section
      id="scene-event"
      ref={sectionRef}
      className="relative flex items-center justify-center overflow-hidden bg-[var(--color-coral)] py-16 sm:py-20"
    >
      {/* Spotlight overlay */}
      <div
        ref={spotlightRef}
        className="pointer-events-none absolute inset-0 transition-none"
      />

      {/* Curtains */}
      <div
        ref={leftCurtain}
        className="absolute inset-y-0 left-0 z-20 w-1/2 bg-[var(--color-coral)]"
      />
      <div
        ref={rightCurtain}
        className="absolute inset-y-0 right-0 z-20 w-1/2 bg-[var(--color-coral)]"
      />

      {/* Content behind curtains */}
      <div ref={contentRef} className="relative z-10 px-6 text-center">
        <p className="event-reveal font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-black)]/60">
          Next Event
        </p>

        <h2 className="event-reveal mt-4 font-[family-name:var(--font-display)] text-6xl text-[var(--color-black)] sm:text-8xl md:text-9xl">
          {CURRENT_EVENT.title}
        </h2>

        <div className="event-reveal mx-auto mt-4 h-px w-24 bg-[var(--color-black)]/20" />

        <div className="mt-6 space-y-2 font-[family-name:var(--font-mono)]">
          <p className="event-reveal text-3xl text-[var(--color-black)] sm:text-4xl">
            {CURRENT_EVENT.date}
          </p>
          <p className="event-reveal text-xl text-[var(--color-black)]/70">
            {CURRENT_EVENT.time}
          </p>
          <p
            className="event-reveal cursor-pointer text-lg text-[var(--color-black)]/50 transition-colors hover:text-[var(--color-black)]"
            onMouseEnter={() => setReelSpin(true)}
            onMouseLeave={() => setReelSpin(false)}
          >
            {CURRENT_EVENT.venue}{" "}
            <span
              className="inline-block transition-transform duration-700"
              style={{ transform: reelSpin ? "rotate(720deg)" : "rotate(0)" }}
            >
              🎬
            </span>
          </p>
        </div>

        <div className="event-reveal mt-10">
          <button
            onClick={handleRsvp}
            disabled={rsvpDisabled}
            onMouseEnter={!rsvpDisabled ? handleNeonHover : undefined}
            className={`rounded-full border-2 px-14 py-5 font-[family-name:var(--font-display)] text-xl transition-all duration-500 ${
              rsvpDisabled
                ? "border-[var(--color-black)] text-[var(--color-black)]"
                : "border-[var(--color-black)] text-[var(--color-black)] hover:bg-[var(--color-black)] hover:text-[var(--color-coral)]"
            }`}
          >
            {rsvpLabel()}
          </button>
        </div>

        <p className="event-reveal mt-4 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-black)]/30">
          Free admission · Limited seating
        </p>
      </div>
    </section>
  );
}
