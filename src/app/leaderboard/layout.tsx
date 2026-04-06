import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard — Creator Space Fort Wayne",
  description:
    "See the most active creators in Fort Wayne's creative community. Earn points by collaborating, attending events, and sharing resources.",
  alternates: { canonical: "https://creatorspacefw.com/leaderboard" },
};

export default function LeaderboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
