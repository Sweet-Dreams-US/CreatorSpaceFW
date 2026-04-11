import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications — Creator Space Fort Wayne",
  description: "Your notifications from Creator Space.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
