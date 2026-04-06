import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collaborate — Creator Space Fort Wayne",
  description: "Find collaborators or offer your skills to Fort Wayne's creative community. Post projects, respond to requests, and build together.",
  openGraph: {
    title: "Collaborate — Creator Space Fort Wayne",
    description: "Find collaborators or offer your skills to Fort Wayne's creative community.",
  },
};

export default function CollaborateLayout({ children }: { children: React.ReactNode }) {
  return children;
}
