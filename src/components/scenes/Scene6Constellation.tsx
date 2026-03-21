"use client";

import { useEffect, useRef } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

const COLORS = ["#fa9277", "#9dfa77", "#77dffa", "#d377fa", "#ffece1"];
const IS_MOBILE = typeof window !== "undefined" && window.innerWidth < 768;
const STAR_COUNT = IS_MOBILE ? 280 : 400;
const EDGE_DIST = IS_MOBILE ? 150 : 200;
const GRID_CELL = EDGE_DIST;

interface Star {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  size: number;
  color: string;
  dist: number;
}

export default function Scene6Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<Star[]>([]);
  const progressRef = useRef(0);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;
    if (!canvas || !section) return;
    const ctx = canvas.getContext("2d")!;
    let raf: number;
    let time = 0;

    const generate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const cx = w / 2;
      const cy = h / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      starsRef.current = [];
      for (let i = 0; i < STAR_COUNT; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        starsRef.current.push({
          baseX: x,
          baseY: y,
          x,
          y,
          size: 1.5 + Math.random() * 2,
          color: COLORS[Math.floor(Math.random() * COLORS.length)],
          dist: Math.sqrt((x - cx) ** 2 + (y - cy) ** 2) / maxDist,
        });
      }
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      generate();
    };
    resize();

    const gsapCtx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom 20%",
        onUpdate: (self) => {
          progressRef.current = self.progress;
        },
      });
      gsap.from(textRef.current, {
        opacity: 0,
        y: 30,
        duration: 1,
        scrollTrigger: { trigger: section, start: "top 40%" },
      });
    }, section);

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      time += 0.002;

      const progress = progressRef.current;
      const stars = starsRef.current;

      // Update floating positions
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x = s.baseX + Math.sin(time + i * 0.3) * 3;
        s.y = s.baseY + Math.cos(time + i * 0.4) * 3;
      }

      // Compute per-star alpha: grows from centre outward
      const alphas = new Float32Array(stars.length);
      for (let i = 0; i < stars.length; i++) {
        const t = (progress - stars[i].dist * 0.65) / 0.35;
        alphas[i] = t < 0 ? 0 : t > 1 ? 1 : t;
      }

      // Spatial grid for edge lookups
      const cols = Math.ceil(w / GRID_CELL);
      const rows = Math.ceil(h / GRID_CELL);
      const grid: number[][] = new Array(cols * rows);
      for (let i = 0; i < grid.length; i++) grid[i] = [];
      for (let i = 0; i < stars.length; i++) {
        if (alphas[i] <= 0) continue;
        const col = Math.floor(stars[i].x / GRID_CELL);
        const row = Math.floor(stars[i].y / GRID_CELL);
        if (col >= 0 && col < cols && row >= 0 && row < rows) {
          grid[row * cols + col].push(i);
        }
      }

      // Draw edges — lines branch from centre stars outward
      ctx.lineWidth = 1;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const cell = grid[row * cols + col];
          if (cell.length === 0) continue;
          for (let dr = 0; dr <= 1; dr++) {
            for (let dc = dr === 0 ? 0 : -1; dc <= 1; dc++) {
              const nr = row + dr;
              const nc = col + dc;
              if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
              const neighbor = grid[nr * cols + nc];
              if (neighbor.length === 0) continue;
              const same = dr === 0 && dc === 0;
              for (let a = 0; a < cell.length; a++) {
                const ai = cell[a];
                const sa = stars[ai];
                const bStart = same ? a + 1 : 0;
                for (let b = bStart; b < neighbor.length; b++) {
                  const bi = neighbor[b];
                  const sb = stars[bi];
                  const dx = sa.x - sb.x;
                  const dy = sa.y - sb.y;
                  const d = Math.sqrt(dx * dx + dy * dy);
                  if (d < EDGE_DIST) {
                    const pairAlpha = Math.min(alphas[ai], alphas[bi]);
                    const edgeAlpha = (1 - d / EDGE_DIST) * 0.6 * pairAlpha;
                    if (edgeAlpha > 0.005) {
                      ctx.strokeStyle = `rgba(250,146,119,${edgeAlpha})`;
                      ctx.beginPath();
                      ctx.moveTo(sa.x, sa.y);
                      ctx.lineTo(sb.x, sb.y);
                      ctx.stroke();
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Draw stars — dim baseline, bright when active
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        const a = alphas[i];
        // All stars faintly visible, active ones glow
        const baseAlpha = 0.08;
        const starAlpha = baseAlpha + (1 - baseAlpha) * a;

        if (a > 0.3) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = s.color;
        } else {
          ctx.shadowBlur = 0;
        }

        ctx.globalAlpha = starAlpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, a > 0.3 ? s.size : s.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };

    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gsapCtx.revert();
    };
  }, []);

  return (
    <section
      id="scene-constellation"
      ref={sectionRef}
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--color-black)]"
      style={{ minHeight: "120vh" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div ref={textRef} className="relative z-10 px-6 text-center">
        <p className="font-[family-name:var(--font-mono)] text-base leading-relaxed text-[var(--color-mist)] sm:text-lg">
          ALONE, YOU&apos;RE A POINT OF LIGHT.
        </p>
        <p className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-6xl md:text-7xl">
          TOGETHER, WE&apos;RE
          <br />A CONSTELLATION.
        </p>
        <div className="mt-10">
          <p className="font-[family-name:var(--font-mono)] text-sm font-bold uppercase tracking-widest text-[var(--color-mist)]">
            Find Your Collaborators
          </p>
          <a
            href="/directory"
            className="mt-4 inline-block rounded-full border border-[var(--color-white)] px-8 py-3 font-[family-name:var(--font-display)] text-sm text-[var(--color-white)] transition-all duration-300 hover:bg-[var(--color-white)] hover:text-[var(--color-black)]"
          >
            Explore the Network →
          </a>
        </div>
      </div>
    </section>
  );
}
