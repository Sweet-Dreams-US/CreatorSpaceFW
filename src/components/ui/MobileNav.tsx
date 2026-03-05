"use client";

import { useState, useEffect } from "react";

const SCENES = [
  { id: "scene-arrival", label: "Home" },
  { id: "scene-landing", label: "Meetups" },
  { id: "scene-event", label: "Next Event" },
  { id: "scene-community", label: "Creators" },
  { id: "scene-constellation", label: "Connect" },
  { id: "scene-close", label: "Contact" },
];

const PAGES = [
  { label: "Creator Directory", href: "/directory" },
  { label: "Design System", href: "/design-system" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);

  // Track active section
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = SCENES.findIndex((s) => s.id === entry.target.id);
            if (idx !== -1) setActive(idx);
          }
        });
      },
      { threshold: 0.3 }
    );

    SCENES.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const scrollTo = (id: string) => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed right-4 top-4 z-[201] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-black)]/80 backdrop-blur-md"
        aria-label={open ? "Close menu" : "Open menu"}
      >
        <div className="flex w-5 flex-col items-center gap-[5px]">
          <span
            className="block h-[1.5px] w-full bg-[var(--color-white)] transition-all duration-300"
            style={{
              transform: open ? "translateY(3.25px) rotate(45deg)" : "none",
            }}
          />
          <span
            className="block h-[1.5px] w-full bg-[var(--color-white)] transition-all duration-300"
            style={{
              opacity: open ? 0 : 1,
            }}
          />
          <span
            className="block h-[1.5px] w-full bg-[var(--color-white)] transition-all duration-300"
            style={{
              transform: open ? "translateY(-3.25px) rotate(-45deg)" : "none",
            }}
          />
        </div>
      </button>

      {/* Fullscreen overlay */}
      <div
        className="fixed inset-0 z-[200] transition-all duration-300"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-[var(--color-black)]/95 backdrop-blur-md"
          onClick={() => setOpen(false)}
        />

        {/* Menu content */}
        <div className="relative flex h-full flex-col items-center justify-center gap-1">
          {/* Sections */}
          {SCENES.map((scene, i) => (
            <button
              key={scene.id}
              onClick={() => scrollTo(scene.id)}
              className="group flex items-center gap-3 px-6 py-3 transition-all duration-300"
              style={{
                transform: open
                  ? "translateY(0)"
                  : `translateY(${20 + i * 5}px)`,
                opacity: open ? 1 : 0,
                transitionDelay: open ? `${i * 50}ms` : "0ms",
              }}
            >
              <span
                className="block h-1.5 w-1.5 rounded-full transition-all duration-300"
                style={{
                  backgroundColor:
                    active === i ? "#fa9277" : "rgba(255,255,255,0.15)",
                  boxShadow:
                    active === i ? "0 0 8px #fa9277" : "none",
                }}
              />
              <span
                className="font-[family-name:var(--font-display)] text-3xl transition-colors duration-300"
                style={{
                  color:
                    active === i
                      ? "var(--color-white)"
                      : "var(--color-smoke)",
                }}
              >
                {scene.label}
              </span>
            </button>
          ))}

          {/* Divider */}
          <div
            className="my-4 h-px w-16 bg-white/10 transition-all duration-300"
            style={{
              opacity: open ? 1 : 0,
              transitionDelay: open ? `${SCENES.length * 50}ms` : "0ms",
            }}
          />

          {/* Page links */}
          {PAGES.map((page, i) => (
            <a
              key={page.href}
              href={page.href}
              className="px-6 py-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-smoke)] transition-all duration-300 hover:text-[var(--color-white)]"
              style={{
                transform: open
                  ? "translateY(0)"
                  : "translateY(20px)",
                opacity: open ? 1 : 0,
                transitionDelay: open
                  ? `${(SCENES.length + 1 + i) * 50}ms`
                  : "0ms",
              }}
            >
              {page.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
