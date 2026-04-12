import type { Metadata } from "next";
import { Changa_One, IBM_Plex_Mono } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import PageViewTracker from "@/components/tracking/PageViewTracker";
import ErrorBoundary from "@/components/ErrorBoundary";
import { OrganizationJsonLd, WebsiteJsonLd } from "@/components/seo/JsonLd";
import { Analytics } from "@vercel/analytics/next";
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
  title: {
    default: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
    template: "%s | Creator Space Fort Wayne",
  },
  description:
    "Fort Wayne's creative community directory. Find and connect with local videographers, photographers, designers, musicians, developers, and more. Free monthly meetups for creators of all kinds.",
  metadataBase: new URL("https://creatorspacefw.com"),
  keywords: [
    "Fort Wayne creators",
    "Fort Wayne creative community",
    "Fort Wayne videographers",
    "Fort Wayne photographers",
    "Fort Wayne designers",
    "Fort Wayne musicians",
    "Fort Wayne developers",
    "Indiana creative directory",
    "creator directory",
    "creative meetups Fort Wayne",
    "Fort Wayne freelancers",
    "hire creatives Fort Wayne",
    "Creator Space FW",
  ],
  authors: [{ name: "Creator Space Fort Wayne" }],
  creator: "Creator Space Fort Wayne",
  publisher: "Creator Space Fort Wayne",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "https://creatorspacefw.com",
  },
  openGraph: {
    title: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
    description:
      "Fort Wayne's creative community directory. Find and connect with local videographers, photographers, designers, musicians, developers, and more. Free monthly meetups for creators of all kinds.",
    url: "https://creatorspacefw.com",
    siteName: "Creator Space Fort Wayne",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Creator Space Fort Wayne — Connect. Create. Collaborate.",
    description:
      "Fort Wayne's creative community directory. Find and connect with local creators. Free monthly meetups.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "theme-color": "#0a0a0a",
    "geo.region": "US-IN",
    "geo.placename": "Fort Wayne",
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
        <OrganizationJsonLd />
        <WebsiteJsonLd />
        <AuthProvider>
          <PageViewTracker />
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
