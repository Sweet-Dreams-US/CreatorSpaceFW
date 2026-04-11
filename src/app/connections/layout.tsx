import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Connections — Creator Space Fort Wayne",
  description: "Manage your creator connections and network.",
  alternates: { canonical: "https://creatorspacefw.com/connections" },
};

export default function ConnectionsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
