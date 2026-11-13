import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Blog posts are read from content/blog when a page revalidates (hourly) or
  // is requested, which is how a post releases on its date without a deploy.
  // Ship the files with every function that reads them.
  outputFileTracingIncludes: {
    "/blog": ["./content/blog/**/*"],
    "/blog/[slug]": ["./content/blog/**/*"],
    "/blog/rss.xml": ["./content/blog/**/*"],
    "/blog/images/[slug]/[file]": ["./content/blog/**/*"],
    "/api/blog/status": ["./content/blog/**/*"],
    "/sitemap.xml": ["./content/blog/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "eymjahxzesuoahpwzifq.supabase.co",
        pathname: "/storage/**",
      },
      {
        protocol: "https",
        hostname: "nxhwqtqroyerbbklywyn.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600, s-maxage=3600" },
        ],
      },
    ];
  },
};

export default nextConfig;
