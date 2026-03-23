import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Join Creator Space Fort Wayne",
  description:
    "Claim your spot in Fort Wayne's creative directory. Sign up free and connect with local creators.",
  alternates: {
    canonical: "https://creatorspacefw.com/auth/signup",
  },
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children;
}
