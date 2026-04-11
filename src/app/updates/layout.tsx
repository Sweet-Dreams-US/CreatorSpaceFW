import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Updates & Feedback — Creator Space Fort Wayne",
  description: "See what's new on Creator Space and share your feedback to help us improve.",
  alternates: { canonical: "https://creatorspacefw.com/updates" },
};

export default function UpdatesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
