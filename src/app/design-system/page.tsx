"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/* ────────────────────────────────────────────
   DESIGN SYSTEM — Creator Space Fort Wayne
   Colors · Typography · Animation · Texture
──────────────────────────────────────────── */

const COLORS = [
  { name: "Coral", hex: "#fa9277", token: "coral", role: "Primary accent" },
  { name: "Peach", hex: "#ffece1", token: "peach", role: "Warm light" },
  { name: "Lime", hex: "#9dfa77", token: "lime", role: "Energy / success" },
  { name: "Sky", hex: "#77dffa", token: "sky", role: "Cool accent" },
  { name: "Violet", hex: "#d377fa", token: "violet", role: "Creative / bold" },
];

const NEUTRALS = [
  { name: "Black", hex: "#0a0a0a" },
  { name: "Dark", hex: "#141414" },
  { name: "Charcoal", hex: "#1e1e1e" },
  { name: "Ash", hex: "#2a2a2a" },
  { name: "Smoke", hex: "#888888" },
  { name: "Mist", hex: "#cccccc" },
  { name: "White", hex: "#fafafa" },
];

export default function DesignSystem() {
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<(HTMLElement | null)[]>([]);
  const liquidRef = useRef<SVGFETurbulenceElement>(null);
  const neonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Hero text stagger
    if (heroRef.current) {
      const words = heroRef.current.querySelectorAll(".hero-word");
      gsap.fromTo(
        words,
        { y: 80, opacity: 0, rotateX: -15 },
        {
          y: 0,
          opacity: 1,
          rotateX: 0,
          duration: 1,
          ease: "power3.out",
          stagger: 0.12,
        }
      );
    }

    // Sections fade-in on scroll
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(entry.target, {
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power2.out",
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) {
        gsap.set(section, { opacity: 0, y: 40 });
        observer.observe(section);
      }
    });

    // Liquid distortion animation
    if (liquidRef.current) {
      const turbulence = liquidRef.current;
      let frame = 0;
      const animate = () => {
        frame += 0.005;
        turbulence.setAttribute("baseFrequency", `${0.02 + Math.sin(frame) * 0.008} ${0.04 + Math.cos(frame) * 0.008}`);
        requestAnimationFrame(animate);
      };
      animate();
    }

    return () => observer.disconnect();
  }, []);

  const addSection = (el: HTMLElement | null, index: number) => {
    sectionsRef.current[index] = el;
  };

  return (
    <main className="min-h-screen bg-[var(--color-black)] text-[var(--color-white)]">
      {/* ── HERO ── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Noise texture overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat",
          }}
        />
        {/* Gradient glow */}
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            background:
              "radial-gradient(ellipse 60% 40% at 50% 50%, var(--color-coral), transparent)",
          }}
        />

        <div ref={heroRef} className="relative z-10 text-center">
          <p className="hero-word mb-4 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-smoke)]">
            Design System
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-6xl leading-none tracking-tight sm:text-8xl md:text-9xl">
            <span className="hero-word block text-[var(--color-coral)]">CREATOR</span>
            <span className="hero-word block text-[var(--color-white)]">SPACE</span>
          </h1>
          <p className="hero-word mt-6 font-[family-name:var(--font-mono)] text-lg text-[var(--color-smoke)] sm:text-xl">
            Fort Wayne
          </p>
        </div>

        <div className="absolute bottom-8 animate-bounce">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[var(--color-smoke)]">
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </section>

      {/* ── COLORS ── */}
      <section ref={(el) => addSection(el, 0)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>01</SectionLabel>
        <SectionTitle>Color Palette</SectionTitle>
        <p className="mb-12 max-w-xl font-[family-name:var(--font-mono)] text-base leading-relaxed text-[var(--color-smoke)]">
          Bold, vibrant, unapologetic. Each color represents a facet of creativity — warmth, energy, clarity, imagination.
        </p>

        {/* Main palette */}
        <div className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
          {COLORS.map((c) => (
            <div key={c.token} className="group">
              <div
                className="mb-3 aspect-square rounded-2xl transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: c.hex }}
              />
              <p className="font-[family-name:var(--font-display)] text-lg">{c.name}</p>
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                {c.hex}
              </p>
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                {c.role}
              </p>
            </div>
          ))}
        </div>

        {/* Neutrals */}
        <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
          Neutrals
        </h3>
        <div className="flex gap-2">
          {NEUTRALS.map((c) => (
            <div key={c.name} className="group flex-1">
              <div
                className="mb-2 aspect-[3/2] rounded-lg border border-white/5 transition-transform duration-300 group-hover:scale-105"
                style={{ backgroundColor: c.hex }}
              />
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                {c.name}
              </p>
            </div>
          ))}
        </div>

        {/* Color on dark combos */}
        <h3 className="mb-6 mt-16 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
          On Dark Background
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COLORS.map((c) => (
            <div
              key={`combo-${c.token}`}
              className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-6"
            >
              <p
                className="font-[family-name:var(--font-display)] text-3xl"
                style={{ color: c.hex }}
              >
                Creator Space
              </p>
              <p className="mt-2 text-sm text-[var(--color-mist)]">
                {c.name} on Dark — body text in Mist
              </p>
            </div>
          ))}
          <div className="rounded-xl border border-white/5 bg-[var(--color-peach)] p-6">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-black)]">
              Creator Space
            </p>
            <p className="mt-2 text-sm text-[var(--color-charcoal)]">
              Black on Peach — inverted warmth
            </p>
          </div>
        </div>

        {/* Gradient experiments */}
        <h3 className="mb-6 mt-16 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
          Gradients
        </h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #fa9277, #d377fa)" }} />
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #77dffa, #9dfa77)" }} />
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #d377fa, #77dffa)" }} />
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #fa9277, #ffece1)" }} />
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #0a0a0a, #1e1e1e 40%, #fa9277)" }} />
          <div className="aspect-video rounded-xl" style={{ background: "linear-gradient(135deg, #9dfa77, #d377fa, #77dffa)" }} />
        </div>
      </section>

      {/* ── TYPOGRAPHY ── */}
      <section ref={(el) => addSection(el, 1)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>02</SectionLabel>
        <SectionTitle>Typography</SectionTitle>

        {/* Changa One — Display */}
        <div className="mb-20">
          <FontLabel name="Changa One" role="Display / Headlines" />
          <div className="space-y-4 font-[family-name:var(--font-display)]">
            <p className="text-8xl leading-none text-[var(--color-white)] sm:text-[10rem]">
              CREATE
            </p>
            <p className="text-6xl leading-none text-[var(--color-coral)] sm:text-8xl">
              FORT WAYNE
            </p>
            <p className="text-4xl leading-none text-[var(--color-lime)] sm:text-6xl">
              EVERY MONTH
            </p>
            <p className="text-2xl leading-none text-[var(--color-sky)]">
              ALWAYS FREE
            </p>
            <p className="text-lg text-[var(--color-violet)]">
              A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
            </p>
            <p className="text-lg text-[var(--color-smoke)]">
              a b c d e f g h i j k l m n o p q r s t u v w x y z
            </p>
            <p className="text-lg text-[var(--color-smoke)]">
              0 1 2 3 4 5 6 7 8 9 ! @ # $ % &amp;
            </p>
          </div>
        </div>

        {/* IBM Plex Mono — Body / Labels / Code */}
        <div className="mb-20">
          <FontLabel name="IBM Plex Mono" role="Body / Labels / Subtext / Code" />
          <div className="space-y-6 font-[family-name:var(--font-mono)]">
            {/* Body text samples */}
            <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-white)]">
              Creator Space is a free monthly meetup for Fort Wayne&apos;s creative community. Photographers, videographers, musicians, designers, writers, developers, makers, dreamers.
            </p>
            <p className="max-w-2xl text-base leading-relaxed text-[var(--color-mist)]">
              Every month at Cinema Center, we bring together the people who make things. Not to network. Not to pitch. Just to meet, share work, and find each other. Because the best collaborations start with a conversation, not a contract.
            </p>
            <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-smoke)]">
              100% of merch profits go back to creators. Not some. All. When you buy a shirt, you&apos;re funding the next event, the next meetup, the next moment where two strangers realize they should be making something together.
            </p>

            {/* Weight showcase */}
            <div className="flex gap-8 text-sm">
              <span className="font-normal text-[var(--color-mist)]">Regular 400</span>
              <span className="font-medium text-[var(--color-white)]">Medium 500</span>
              <span className="font-semibold text-[var(--color-coral)]">Semi 600</span>
            </div>

            {/* Label / Code styles */}
            <div className="mt-8 space-y-4 border-t border-white/5 pt-8">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--color-smoke)]">
                Section Label — Tracking Wide
              </p>
              <p className="text-sm text-[var(--color-peach)]">
                Meet. Share. Grow.
              </p>
              <p className="text-sm text-[var(--color-lime)]">
                $ npm run create --space fort-wayne
              </p>
              <p className="text-sm text-[var(--color-sky)]">
                RSVP_STATUS: CONFIRMED // JAN 29, 2026
              </p>
              <p className="text-sm text-[var(--color-violet)]">
                creators.length → 47 and counting
              </p>
              <div className="mt-4 rounded-lg bg-[var(--color-charcoal)] p-4">
                <p className="text-xs text-[var(--color-smoke)]">
                  <span className="text-[var(--color-violet)]">const</span>{" "}
                  <span className="text-[var(--color-sky)]">creatorSpace</span> = {"{"}
                </p>
                <p className="text-xs text-[var(--color-smoke)]">
                  {"  "}location: <span className="text-[var(--color-lime)]">&quot;Cinema Center&quot;</span>,
                </p>
                <p className="text-xs text-[var(--color-smoke)]">
                  {"  "}cost: <span className="text-[var(--color-coral)]">0</span>,
                </p>
                <p className="text-xs text-[var(--color-smoke)]">
                  {"  "}vibe: <span className="text-[var(--color-lime)]">&quot;immaculate&quot;</span>,
                </p>
                <p className="text-xs text-[var(--color-smoke)]">{"}"}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TYPE SCALE ── */}
      <section ref={(el) => addSection(el, 2)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>03</SectionLabel>
        <SectionTitle>Type Scale</SectionTitle>
        <div className="space-y-8">
          {[
            { size: "text-[10rem]", label: "10rem / 160px", text: "Aa" },
            { size: "text-8xl", label: "6rem / 96px", text: "Headlines" },
            { size: "text-6xl", label: "3.75rem / 60px", text: "Sub Headlines" },
            { size: "text-4xl", label: "2.25rem / 36px", text: "Section Title" },
            { size: "text-2xl", label: "1.5rem / 24px", text: "Large Body Text" },
            { size: "text-lg", label: "1.125rem / 18px", text: "Body Text" },
            { size: "text-base", label: "1rem / 16px", text: "Default Body" },
            { size: "text-sm", label: "0.875rem / 14px", text: "Small Text" },
            { size: "text-xs", label: "0.75rem / 12px", text: "Caption / Label" },
          ].map((item) => (
            <div key={item.label} className="flex items-baseline gap-6 border-b border-white/5 pb-4">
              <span className="w-40 shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                {item.label}
              </span>
              <span className={`${item.size} font-[family-name:var(--font-display)] leading-none text-[var(--color-white)]`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── ANIMATION FEELS ── */}
      <section ref={(el) => addSection(el, 3)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>04</SectionLabel>
        <SectionTitle>Animation Feels</SectionTitle>

        {/* Liquid distortion */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Liquid Distortion — SVG Filter
          </h3>
          <svg className="absolute h-0 w-0">
            <defs>
              <filter id="liquid">
                <feTurbulence
                  ref={liquidRef}
                  type="fractalNoise"
                  baseFrequency="0.02 0.04"
                  numOctaves="3"
                  result="noise"
                />
                <feDisplacementMap
                  in="SourceGraphic"
                  in2="noise"
                  scale="12"
                  xChannelSelector="R"
                  yChannelSelector="G"
                />
              </filter>
            </defs>
          </svg>
          <p
            className="font-[family-name:var(--font-display)] text-7xl text-[var(--color-coral)] sm:text-9xl"
            style={{ filter: "url(#liquid)" }}
          >
            CREATORS
          </p>
        </div>

        {/* Neon flicker */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Neon Glow — Button Hover
          </h3>
          <NeonButton ref={neonRef} />
        </div>

        {/* Stagger reveal */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Stagger Reveal — Text Entrance
          </h3>
          <StaggerReveal />
        </div>

        {/* Breathing pulse */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Breathing Pulse — Orbs
          </h3>
          <div className="flex items-center gap-8">
            {COLORS.map((c, i) => (
              <div
                key={`orb-${c.token}`}
                className="rounded-full"
                style={{
                  width: 40 + i * 12,
                  height: 40 + i * 12,
                  backgroundColor: c.hex,
                  boxShadow: `0 0 ${20 + i * 8}px ${c.hex}80`,
                  animation: `pulse-glow 3s ease-in-out ${i * 0.4}s infinite`,
                }}
              />
            ))}
          </div>
          <style>{`
            @keyframes pulse-glow {
              0%, 100% { transform: scale(1); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 1; }
            }
          `}</style>
        </div>

        {/* Typewriter */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Typewriter — Closing Beat
          </h3>
          <Typewriter text="SEE YOU THERE" />
        </div>

        {/* Noise texture */}
        <div className="mb-20">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Noise + Gradient — Atmosphere
          </h3>
          <div className="relative h-64 overflow-hidden rounded-2xl">
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(135deg, #0a0a0a, #1e1e1e 30%, #fa927740 60%, #d377fa30)",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.06]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            />
            <div className="relative flex h-full items-center justify-center">
              <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
                ATMOSPHERE
              </p>
            </div>
          </div>
        </div>

        {/* Curtain reveal */}
        <div>
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Curtain Reveal — Click to Open
          </h3>
          <CurtainReveal />
        </div>
      </section>

      {/* ── COMPONENTS ── */}
      <section ref={(el) => addSection(el, 4)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>05</SectionLabel>
        <SectionTitle>Component Patterns</SectionTitle>

        {/* Buttons */}
        <div className="mb-16">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Buttons
          </h3>
          <div className="flex flex-wrap items-center gap-4">
            <button className="rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_#fa927780]">
              RSVP
            </button>
            <button className="rounded-full border border-[var(--color-white)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-white)] transition-all duration-300 hover:bg-[var(--color-white)] hover:text-[var(--color-black)]">
              EXPLORE
            </button>
            <button className="rounded-full bg-[var(--color-charcoal)] px-8 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all duration-300 hover:text-[var(--color-white)]">
              Join the Database →
            </button>
            <button className="rounded-full bg-[var(--color-lime)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_#9dfa7780]">
              SHOP
            </button>
            <button className="rounded-full bg-[var(--color-violet)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_#d377fa80]">
              CREATE
            </button>
          </div>
        </div>

        {/* Tags / Pills */}
        <div className="mb-16">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Discipline Tags
          </h3>
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Photo", color: "#fa9277" },
              { label: "Video", color: "#d377fa" },
              { label: "Music", color: "#9dfa77" },
              { label: "Design", color: "#77dffa" },
              { label: "Code", color: "#ffece1" },
              { label: "Other", color: "#888888" },
            ].map((tag) => (
              <span
                key={tag.label}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs transition-colors duration-300 hover:bg-white/10"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: tag.color }}
                />
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Card */}
        <div className="mb-16">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Event Card
          </h3>
          <div className="group relative max-w-md overflow-hidden rounded-2xl border border-white/5 bg-[var(--color-dark)] transition-all duration-500 hover:border-[var(--color-coral)]/30">
            <div className="aspect-video w-full bg-gradient-to-br from-[var(--color-coral)] to-[var(--color-violet)] opacity-80 transition-transform duration-700 group-hover:scale-105" />
            <div className="p-6">
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)]">
                JAN 29, 2026 • 6:00 PM
              </p>
              <h4 className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                2026 Kick-Off
              </h4>
              <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                Cinema Center • Fort Wayne, IN
              </p>
            </div>
          </div>
        </div>

        {/* Input */}
        <div className="mb-16">
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Form Input — Conversational Style
          </h3>
          <div className="max-w-lg">
            <p className="mb-3 font-[family-name:var(--font-mono)] text-2xl font-light text-[var(--color-white)]">
              What&apos;s your name?
            </p>
            <div className="flex items-center gap-3 border-b-2 border-[var(--color-ash)] pb-2 transition-colors focus-within:border-[var(--color-coral)]">
              <input
                type="text"
                placeholder="Type here..."
                className="flex-1 bg-transparent font-[family-name:var(--font-mono)] text-lg text-[var(--color-white)] outline-none placeholder:text-[var(--color-ash)]"
              />
              <button className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-coral)] text-[var(--color-black)] transition-transform hover:scale-110">
                →
              </button>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div>
          <h3 className="mb-6 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-[var(--color-smoke)]">
            Progress Line
          </h3>
          <div className="h-0.5 w-full overflow-hidden rounded-full bg-[var(--color-ash)]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[var(--color-coral)] to-[var(--color-violet)]"
              style={{ width: "65%", transition: "width 1s ease" }}
            />
          </div>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
            Step 4 of 6
          </p>
        </div>
      </section>

      {/* ── SPACING & LAYOUT ── */}
      <section ref={(el) => addSection(el, 5)} className="px-6 py-24 sm:px-12 lg:px-24">
        <SectionLabel>06</SectionLabel>
        <SectionTitle>Spacing & Texture</SectionTitle>

        <p className="mb-12 max-w-xl font-[family-name:var(--font-mono)] text-base leading-relaxed text-[var(--color-smoke)]">
          The site should breathe. Generous whitespace. Nothing feels crammed. Dark backgrounds with subtle texture give depth without distraction.
        </p>

        {/* Texture showcase */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[var(--color-dark)]">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: "repeat",
              }}
            />
            <div className="relative flex h-full items-center justify-center">
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">Film Grain</p>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: "radial-gradient(ellipse at center, #fa927720, transparent 70%), var(--color-dark)" }}>
            <div className="flex h-full items-center justify-center">
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">Radial Glow</p>
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-2xl" style={{ background: "linear-gradient(180deg, var(--color-dark) 0%, var(--color-charcoal) 100%)" }}>
            <div className="flex h-full items-center justify-center">
              <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">Subtle Gradient</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 px-6 py-16 text-center sm:px-12">
        <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-coral)]">
          CREATOR SPACE
        </p>
        <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Fort Wayne
        </p>
        <p className="mt-8 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-ash)]">
          Design system v0.1 — Colors, type, animation, texture
        </p>
      </footer>
    </main>
  );
}

/* ── Subcomponents ── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)]">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-8 font-[family-name:var(--font-display)] text-5xl sm:text-6xl">
      {children}
    </h2>
  );
}

function FontLabel({ name, role }: { name: string; role: string }) {
  return (
    <div className="mb-6 flex items-baseline gap-4 border-b border-white/5 pb-4">
      <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
        {name}
      </h3>
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        {role}
      </span>
    </div>
  );
}

import { forwardRef } from "react";

const NeonButton = forwardRef<HTMLButtonElement>(function NeonButton(_props, ref) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleHover = () => {
    const el = btnRef.current;
    if (!el) return;
    // Flicker
    gsap
      .timeline()
      .to(el, { opacity: 0.3, duration: 0.05 })
      .to(el, { opacity: 1, duration: 0.05 })
      .to(el, { opacity: 0.5, duration: 0.04 })
      .to(el, { opacity: 1, duration: 0.06 });
  };

  return (
    <button
      ref={btnRef}
      onMouseEnter={handleHover}
      className="relative rounded-full border-2 border-[var(--color-coral)] px-10 py-4 font-[family-name:var(--font-display)] text-lg text-[var(--color-coral)] transition-shadow duration-300 hover:shadow-[0_0_40px_#fa927780,inset_0_0_40px_#fa927720]"
    >
      RSVP →
    </button>
  );
});

function StaggerReveal() {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    if (!containerRef.current) return;
    const lines = containerRef.current.querySelectorAll(".stagger-line");
    gsap.fromTo(
      lines,
      { y: 60, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.15,
      }
    );
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="mb-6 font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)] underline underline-offset-4"
      >
        Click to replay
      </button>
      <div ref={containerRef} className="overflow-hidden">
        {[
          { text: "PHOTOGRAPHERS", color: "var(--color-coral)" },
          { text: "VIDEOGRAPHERS", color: "var(--color-violet)" },
          { text: "MUSICIANS", color: "var(--color-lime)" },
          { text: "DESIGNERS", color: "var(--color-sky)" },
          { text: "DREAMERS", color: "var(--color-peach)" },
        ].map((item) => (
          <p
            key={item.text}
            className="stagger-line font-[family-name:var(--font-display)] text-4xl sm:text-6xl"
            style={{ color: item.color, opacity: 0 }}
          >
            {item.text}
          </p>
        ))}
      </div>
    </div>
  );
}

function Typewriter({ text }: { text: string }) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    el.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) {
        el.textContent += text[i];
        i++;
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <p className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
      <span ref={textRef} />
      <span className="animate-pulse text-[var(--color-coral)]">_</span>
    </p>
  );
}

function CurtainReveal() {
  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const isOpen = useRef(false);

  const handleClick = () => {
    if (isOpen.current) {
      gsap.to(leftRef.current, { x: "0%", duration: 0.8, ease: "power3.inOut" });
      gsap.to(rightRef.current, { x: "0%", duration: 0.8, ease: "power3.inOut" });
    } else {
      gsap.to(leftRef.current, { x: "-100%", duration: 0.8, ease: "power3.inOut" });
      gsap.to(rightRef.current, { x: "100%", duration: 0.8, ease: "power3.inOut" });
    }
    isOpen.current = !isOpen.current;
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className="mb-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)] underline underline-offset-4"
      >
        Click to toggle curtains
      </button>
      <div className="relative h-48 overflow-hidden rounded-2xl">
        {/* Content behind curtains */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[var(--color-coral)] to-[var(--color-violet)]">
          <div className="text-center">
            <p className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-black)]">
              JANUARY 29TH
            </p>
            <p className="font-[family-name:var(--font-mono)] text-lg text-[var(--color-black)]">
              6:00 PM — Cinema Center
            </p>
          </div>
        </div>
        {/* Left curtain */}
        <div
          ref={leftRef}
          className="absolute inset-y-0 left-0 w-1/2 bg-[var(--color-dark)]"
        />
        {/* Right curtain */}
        <div
          ref={rightRef}
          className="absolute inset-y-0 right-0 w-1/2 bg-[var(--color-dark)]"
        />
      </div>
    </div>
  );
}
