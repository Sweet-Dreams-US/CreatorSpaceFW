"use client";

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

interface InstaPost {
  id: string;
  media_url: string;
  permalink: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  thumbnail_url?: string;
}

export default function SceneSocial() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [posts, setPosts] = useState<InstaPost[]>([]);

  // Fetch Instagram posts from our API route
  useEffect(() => {
    fetch("/api/instagram")
      .then((r) => r.json())
      .then((data) => {
        if (data.posts) setPosts(data.posts);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".social-header", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 70%",
        },
      });

      gsap.from(".social-card", {
        y: 50,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 50%",
        },
      });

      gsap.from(".gallery-header", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        scrollTrigger: {
          trigger: ".gallery-header",
          start: "top 80%",
        },
      });

      gsap.from(".gallery-card", {
        y: 50,
        opacity: 0,
        stagger: 0.06,
        duration: 0.5,
        scrollTrigger: {
          trigger: ".gallery-section",
          start: "top 60%",
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [posts]);

  return (
    <section
      id="scene-social"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--color-black)] py-24"
    >
      {/* ── Instagram Feed ── */}
      <div className="social-header mb-12 px-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-smoke)]">
          Follow the journey
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-6xl">
          @CREATORSPACE_FW
        </h2>
      </div>

      {posts.length > 0 ? (
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {posts.slice(0, 12).map((post) => (
            <a
              key={post.id}
              href={post.permalink}
              target="_blank"
              rel="noopener noreferrer"
              className="social-card group relative aspect-square overflow-hidden"
            >
              <img
                src={
                  post.media_type === "VIDEO"
                    ? post.thumbnail_url || post.media_url
                    : post.media_url
                }
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/40" />
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              >
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
            </a>
          ))}
        </div>
      ) : (
        /* Placeholder grid while loading or if no token */
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <a
              key={i}
              href="https://www.instagram.com/creatorspace_fw/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-card group relative aspect-square overflow-hidden"
            >
              <div
                className="h-full w-full transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `linear-gradient(135deg, ${
                    ["#fa9277", "#d377fa", "#9dfa77", "#77dffa", "#ffece1"][i % 5]
                  }15, var(--color-charcoal))`,
                }}
              />
              <div className="absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/30" />
            </a>
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <a
          href="https://www.instagram.com/creatorspace_fw/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-smoke)] transition-colors duration-300 hover:text-[var(--color-coral)]"
        >
          View more on Instagram →
        </a>
      </div>

      {/* ── Gallery ── */}
      <div className="gallery-section mt-24">
        <div className="gallery-header mb-12 px-6 text-center">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-[var(--color-smoke)]">
            From our events
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-6xl">
            GALLERY
          </h2>
        </div>

        {/* Gallery grid — pulls from Supabase storage */}
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-2 px-4 sm:grid-cols-3 md:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="gallery-card group relative aspect-square overflow-hidden"
            >
              <div
                className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                style={{
                  background: `linear-gradient(${120 + i * 20}deg, ${
                    ["#fa9277", "#d377fa", "#9dfa77", "#77dffa", "#ffece1"][i % 5]
                  }12, var(--color-charcoal))`,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom social links */}
      <div className="mt-16 flex items-center justify-center gap-8">
        <a
          href="https://www.instagram.com/creatorspace_fw/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-smoke)] transition-colors duration-300 hover:text-[var(--color-coral)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
          </svg>
          Instagram
        </a>
        <a
          href="https://www.facebook.com/CreatorSpaceFW"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-smoke)] transition-colors duration-300 hover:text-[var(--color-coral)]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Facebook
        </a>
      </div>
    </section>
  );
}
