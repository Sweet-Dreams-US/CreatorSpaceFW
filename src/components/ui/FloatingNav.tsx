"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { createClient } from "@/lib/supabase";

const SCENES = [
  { id: "scene-arrival", label: "Arrival" },
  { id: "scene-landing", label: "Meetups" },
  { id: "scene-event", label: "Event" },
  { id: "scene-community", label: "Creators" },
  { id: "scene-constellation", label: "Connect" },
  { id: "scene-close", label: "Close" },
];

export default function FloatingNav() {
  const [active, setActive] = useState(0);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const { user } = useAuth();
  const userIsAdmin = !!user && isAdmin(user.email);
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

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

  return (
    <>
    {/* Top-left auth links */}
    <div className="fixed left-5 top-4 z-[100] hidden items-center gap-4 md:flex">
      <a href="/directory" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]">
        Directory
      </a>
      <a href="/collaborate" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]">
        Collaborate
      </a>
      <a href="/challenges" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]">
        Challenges
      </a>
      <a href="/hire" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-lime)] transition-colors hover:text-[var(--color-white)]">
        Hire
      </a>
      {userIsAdmin && (
        <a href="/admin" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-coral)] transition-colors hover:text-[var(--color-white)]">
          Admin
        </a>
      )}
      {user ? (
        <>
          <a href="/profile/edit" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]">
            Profile
          </a>
          <button
            onClick={handleLogout}
            className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
          >
            Log Out
          </button>
        </>
      ) : (
        <a href="/auth/login" className="font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-widest text-[var(--color-smoke)] transition-colors hover:text-[var(--color-white)]">
          Sign In
        </a>
      )}
    </div>
    <nav
      className="fixed right-4 top-1/2 z-[100] hidden -translate-y-1/2 md:block"
      aria-label="Section navigation"
    >
      <div className="flex flex-col items-end gap-3">
        {SCENES.map((scene, i) => (
          <button
            key={scene.id}
            onClick={() =>
              document
                .getElementById(scene.id)
                ?.scrollIntoView({ behavior: "smooth" })
            }
            onMouseEnter={() => setHoveredIdx(i)}
            onMouseLeave={() => setHoveredIdx(null)}
            className="group flex items-center gap-2"
            aria-label={scene.label}
          >
            {/* Label on hover */}
            <span
              className={`font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] transition-opacity duration-200 ${
                hoveredIdx === i ? "opacity-100" : "opacity-0"
              }`}
            >
              {scene.label}
            </span>
            {/* Dot */}
            <span
              className={`block rounded-full transition-all duration-300 ${
                active === i
                  ? "h-2.5 w-2.5 bg-[var(--color-coral)] shadow-[0_0_8px_#fa9277]"
                  : "h-1.5 w-1.5 bg-[var(--color-ash)] group-hover:bg-[var(--color-smoke)]"
              }`}
            />
          </button>
        ))}
      </div>
    </nav>
    </>
  );
}
