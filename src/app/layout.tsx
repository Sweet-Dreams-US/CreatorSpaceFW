import type { Metadata } from "next";
import { Changa_One, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import PageViewTracker from "@/components/tracking/PageViewTracker";
import ErrorBoundary from "@/components/ErrorBoundary";
import "./globals.css";

const changaOne = Changa_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
  description:
    "Fort Wayne's creative community directory. Find and connect with local videographers, photographers, designers, musicians, developers, and more. Free monthly meetups for creators of all kinds.",
  metadataBase: new URL("https://creatorspacefw.com"),
  openGraph: {
    title: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
    description:
      "Fort Wayne's creative community directory. Find and connect with local videographers, photographers, designers, musicians, developers, and more. Free monthly meetups for creators of all kinds.",
    url: "https://creatorspacefw.com",
    siteName: "Creator Space Fort Wayne",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
    description:
      "Fort Wayne's creative community directory. Find and connect with local creators. Free monthly meetups.",
  },
  other: {
    "theme-color": "#0a0a0a",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${changaOne.variable} ${ibmPlexMono.variable}`}>
      <body className="antialiased">
        <AuthProvider>
          <PageViewTracker />
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
