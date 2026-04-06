"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useAuth } from "@/components/providers/AuthProvider";
import { rsvpToEvent, checkRsvp, getWaitlistPosition } from "@/app/actions/rsvp";
import { getEventAttendees, getEventConfirmedCount } from "@/app/actions/events";
import Link from "next/link";

// Fallback event if no DB event is found
const FALLBACK_EVENT = {
  id: "2026-04",
  title: "3 YEAR BASH",
  date: "APRIL 11TH",
  time: "TBD",
  venue: "THE VENUE @ CHARLIE'S PLACE",
  facebookUrl: "https://www.facebook.com/CreatorSpaceFW/events" as string | null,
};

interface EventFromDB {
  id: string;
  title: string;
  date: string;
  location: string | null;
  facebook_url: string | null;
  max_capacity: number | null;
}

interface Attendee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
}

function formatEventFromDB(event: EventFromDB) {
  const d = new Date(event.date);
  const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
  const day = d.getDate();
  const suffix = day === 1 || day === 21 || day === 31 ? "ST" : day === 2 || day === 22 ? "ND" : day === 3 || day === 23 ? "RD" : "TH";
  return {
    id: event.id,
    title: event.title.toUpperCase(),
    date: `${months[d.getMonth()]} ${day}${suffix}`,
    time: d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }).toUpperCase(),
    venue: (event.location || "TBD").toUpperCase(),
    facebookUrl: event.facebook_url,
  };
}

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

export default function Scene4NextEvent({ dbEvent }: { dbEvent?: EventFromDB | null }) {
  const event = dbEvent ? formatEventFromDB(dbEvent) : FALLBACK_EVENT;

  const sectionRef = useRef<HTMLDivElement>(null);
  const leftCurtain = useRef<HTMLDivElement>(null);
  const rightCurtain = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useRef<HTMLDivElement>(null);
  const [reelSpin, setReelSpin] = useState(false);
  const [rsvpState, setRsvpState] = useState<
    "idle" | "loading" | "done" | "already" | "waitlisted"
  >("idle");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [rsvpCount, setRsvpCount] = useState(0);
  const [confirmedCount, setConfirmedCount] = useState(0);
  const [waitlistPosition, setWaitlistPosition] = useState(0);
  const maxCapacity = dbEvent?.max_capacity ?? null;
  const { user, loading: authLoading } = useAuth();

  // Load attendees and check RSVP status
  useEffect(() => {
    getEventAttendees(event.id).then((data) => {
      setAttendees(data as Attendee[]);
      setRsvpCount(data.length);
    });
    getEventConfirmedCount(event.id).then(setConfirmedCount);
    if (!user) return;
    checkRsvp(user.id, event.id).then(async ({ hasRsvpd, waitlisted }) => {
      if (waitlisted) {
        setRsvpState("waitlisted");
        const { position } = await getWaitlistPosition(user.id, event.id);
        setWaitlistPosition(position);
      } else if (hasRsvpd) {
        setRsvpState("already");
      }
    });
  }, [user, event.id]);

  const handleRsvp = useCallback(async () => {
    if (!user) {
      window.location.href = "/auth/login?next=/#scene-event";
      return;
    }

    setRsvpState("loading");
    const result = await rsvpToEvent(user.id, event.id);

    if (result.success) {
      if (result.waitlisted) {
        setRsvpState("waitlisted");
        const { position } = await getWaitlistPosition(user.id, event.id);
        setWaitlistPosition(position);
      } else {
        setRsvpState(result.alreadyRsvpd ? "already" : "done");
      }
      // Refresh attendees and counts
      getEventAttendees(event.id).then((data) => {
        setAttendees(data as Attendee[]);
        setRsvpCount(data.length);
      });
      getEventConfirmedCount(event.id).then(setConfirmedCount);
    } else {
      setRsvpState("idle");
    }
  }, [user, event.id]);

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
    if (rsvpState === "waitlisted") return waitlistPosition > 0 ? `WAITLISTED (#${waitlistPosition})` : "WAITLISTED";
    if (rsvpState === "done" || rsvpState === "already") return "YOU'RE IN ✓";
    if (!user) return "SIGN IN TO RSVP →";
    return "RSVP →";
  };

  const rsvpDisabled =
    rsvpState === "done" || rsvpState === "already" || rsvpState === "loading" || rsvpState === "waitlisted";

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
          {event.title}
        </h2>

        <div className="event-reveal mx-auto mt-4 h-px w-24 bg-[var(--color-black)]/20" />

        <div className="mt-6 space-y-2 font-[family-name:var(--font-mono)]">
          <p className="event-reveal text-3xl text-[var(--color-black)] sm:text-4xl">
            {event.date}
          </p>
          <p className="event-reveal text-xl text-[var(--color-black)]/70">
            {event.time}
          </p>
          <p
            className="event-reveal cursor-pointer text-lg text-[var(--color-black)]/50 transition-colors hover:text-[var(--color-black)]"
            onMouseEnter={() => setReelSpin(true)}
            onMouseLeave={() => setReelSpin(false)}
          >
            {event.venue}{" "}
            <span
              className="inline-block transition-transform duration-700"
              style={{ transform: reelSpin ? "rotate(720deg)" : "rotate(0)" }}
            >
              🎬
            </span>
          </p>
        </div>

        <div className="event-reveal mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
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
          {event.facebookUrl && (
            <a
              href={event.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-[var(--color-black)]/40 px-10 py-5 font-[family-name:var(--font-display)] text-lg text-[var(--color-black)]/70 transition-all duration-500 hover:border-[var(--color-black)] hover:text-[var(--color-black)]"
            >
              FB EVENT →
            </a>
          )}
        </div>

        <p className="event-reveal mt-4 font-[family-name:var(--font-mono)] text-sm font-bold uppercase tracking-widest text-[var(--color-black)]/60">
          Free Admission
        </p>

        {/* Attending Creators */}
        {rsvpCount > 0 && (
          <div className="event-reveal mt-8">
            <p className="mb-3 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-black)]/50">
              {maxCapacity
                ? `${confirmedCount} / ${maxCapacity} Spots`
                : `${rsvpCount} Creator${rsvpCount !== 1 ? "s" : ""} Going`}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {attendees.slice(0, 20).map((attendee, i) => (
                <Link
                  key={attendee.id}
                  href={attendee.slug ? `/directory/${attendee.slug}` : "#"}
                  title={`${attendee.first_name || ""} ${attendee.last_name || ""}`.trim()}
                  className="group relative"
                  style={{ zIndex: 20 - i }}
                >
                  {attendee.avatar_url ? (
                    <img
                      src={attendee.avatar_url}
                      alt={`${attendee.first_name || "Creator"}`}
                      className="h-10 w-10 rounded-full border-2 border-[var(--color-coral)] object-cover transition-transform group-hover:scale-125 group-hover:z-30"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-coral)] bg-[var(--color-black)] font-[family-name:var(--font-mono)] text-xs font-bold text-[var(--color-coral)] transition-transform group-hover:scale-125 group-hover:z-30">
                      {(attendee.first_name?.[0] || "?").toUpperCase()}
                    </div>
                  )}
                </Link>
              ))}
              {rsvpCount > 20 && (
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-[var(--color-black)]/30 bg-[var(--color-black)]/20 font-[family-name:var(--font-mono)] text-xs font-bold text-[var(--color-black)]">
                  +{rsvpCount - 20}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
