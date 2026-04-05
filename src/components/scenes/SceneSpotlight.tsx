"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { getCurrentSpotlight } from "@/app/actions/points";

interface SpotlightCreator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  slug: string | null;
  bio: string | null;
  skills: string | null;
  company: string | null;
  job_title: string | null;
}

interface SpotlightData {
  id: string;
  month: number;
  year: number;
  featured_at: string;
  creators: SpotlightCreator;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function SceneSpotlight() {
  const [spotlight, setSpotlight] = useState<SpotlightData | null>(null);
  const [visible, setVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    getCurrentSpotlight().then((data) => {
      if (data) setSpotlight(data as SpotlightData);
    });
  }, []);

  // Intersection observer for entrance animation
  useEffect(() => {
    if (!sectionRef.current || !spotlight) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [spotlight]);

  // Don't render anything if no spotlight
  if (!spotlight?.creators) return null;

  const creator = spotlight.creators;
  const skills = creator.skills
    ? creator.skills.split(",").map((s) => s.trim()).filter(Boolean)
    : [];
  const bioSnippet = creator.bio
    ? creator.bio.length > 160
      ? creator.bio.slice(0, 160) + "..."
      : creator.bio
    : null;

  return (
    <section
      ref={sectionRef}
      className="relative w-full overflow-hidden bg-[var(--color-black)] py-20"
    >
      {/* Subtle glow behind card */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div
          className="h-[400px] w-[400px] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-coral), transparent)" }}
        />
      </div>

      <div
        className="relative mx-auto max-w-2xl px-6 transition-all duration-1000 ease-out"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(40px)",
        }}
      >
        {/* Label */}
        <p className="mb-6 text-center font-[family-name:var(--font-mono)] text-xs uppercase tracking-[4px] text-[var(--color-smoke)]">
          Creator of the Month &mdash; {MONTHS[spotlight.month - 1]} {spotlight.year}
        </p>

        {/* Card */}
        <div className="rounded-2xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-8 text-center shadow-2xl shadow-[var(--color-coral)]/5">
          {/* Avatar */}
          <div className="mx-auto mb-5 h-28 w-28 overflow-hidden rounded-full ring-2 ring-[var(--color-coral)]/60 ring-offset-4 ring-offset-[var(--color-dark)]">
            {creator.avatar_url ? (
              <img
                src={creator.avatar_url}
                alt={`${creator.first_name} ${creator.last_name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-3xl text-[var(--color-coral)]">
                {(creator.first_name?.[0] || "")}{(creator.last_name?.[0] || "")}
              </div>
            )}
          </div>

          {/* Name */}
          <h2 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
            {creator.first_name} {creator.last_name}
          </h2>

          {/* Title / Company */}
          {(creator.job_title || creator.company) && (
            <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
              {creator.job_title && creator.company
                ? `${creator.job_title} at ${creator.company}`
                : creator.job_title || creator.company}
            </p>
          )}

          {/* Bio */}
          {bioSnippet && (
            <p className="mx-auto mt-4 max-w-md font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
              {bioSnippet}
            </p>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <div className="mx-auto mt-5 flex max-w-md flex-wrap justify-center gap-2">
              {skills.slice(0, 6).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[var(--color-ash)] px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)] transition-colors hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
                >
                  {skill}
                </span>
              ))}
            </div>
          )}

          {/* CTA */}
          {creator.slug && (
            <Link
              href={`/directory/${creator.slug}`}
              className="mt-6 inline-block rounded-full bg-[var(--color-coral)] px-6 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
            >
              View Profile
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
