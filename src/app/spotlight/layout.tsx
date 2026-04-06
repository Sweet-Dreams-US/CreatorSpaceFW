import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Spotlight — Creator Space Fort Wayne",
  description: "Celebrating Fort Wayne's most active creators each month. See who's leading the community and past spotlights.",
  openGraph: {
    title: "Creator Spotlight — Creator Space Fort Wayne",
    description: "Celebrating Fort Wayne's most active creators each month.",
  },
};

export default function SpotlightLayout({ children }: { children: React.ReactNode }) {
  return children;
}
