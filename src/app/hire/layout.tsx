import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hire a Creator — Creator Space Fort Wayne",
  description: "Need creative talent in Fort Wayne? Tell us what you need and we'll connect you with the right creator — video, photo, design, music, and more.",
  openGraph: {
    title: "Hire a Creator — Creator Space Fort Wayne",
    description: "Need creative talent in Fort Wayne? We'll connect you with the right creator.",
  },
};

export default function HireLayout({ children }: { children: React.ReactNode }) {
  return children;
}
