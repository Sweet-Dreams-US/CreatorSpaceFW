import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills Exchange — Creator Space Fort Wayne",
  description: "Teach what you know, learn what you don't. Find Fort Wayne creators to exchange skills with — video, music, design, code, and more.",
  openGraph: {
    title: "Skills Exchange — Creator Space Fort Wayne",
    description: "Teach what you know, learn what you don't. Exchange skills with Fort Wayne creators.",
  },
};

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
