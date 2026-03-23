import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/profile/edit/", "/onboarding/"],
      },
    ],
    sitemap: "https://creatorspacefw.com/sitemap.xml",
  };
}
