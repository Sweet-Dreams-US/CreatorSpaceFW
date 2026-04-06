import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monthly Challenges — Creator Space Fort Wayne",
  description: "Creative challenges for Fort Wayne creators. Submit your work, see what others are making, and get featured.",
  openGraph: {
    title: "Monthly Challenges — Creator Space Fort Wayne",
    description: "Creative challenges for Fort Wayne creators. Submit your work and get featured.",
  },
};

export default function ChallengesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
