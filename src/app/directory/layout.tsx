import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Creator Directory — Find Fort Wayne Creatives",
  description:
    "Browse Fort Wayne's creative community. Search by skill — videographers, photographers, designers, musicians, developers, and more. Connect and collaborate locally.",
  alternates: {
    canonical: "https://creatorspacefw.com/directory",
  },
  openGraph: {
    title: "Creator Directory — Find Fort Wayne Creatives",
    description:
      "Browse Fort Wayne's creative community. Search by skill — videographers, photographers, designers, musicians, developers, and more.",
    url: "https://creatorspacefw.com/directory",
  },
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
