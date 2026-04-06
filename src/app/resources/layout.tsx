import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community Resources — Creator Space Fort Wayne",
  description: "Share and borrow equipment, studio space, software, and more with Fort Wayne creators. List your resources or find what you need.",
  openGraph: {
    title: "Community Resources — Creator Space Fort Wayne",
    description: "Share and borrow equipment, studio space, software, and more with Fort Wayne creators.",
  },
};

export default function ResourcesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
