export interface SocialLink {
  platform: "instagram" | "tiktok" | "youtube" | "twitter" | "linkedin" | "facebook" | "website" | "other";
  handle: string;
  url: string;
  label: string;
}

export function parseSocialField(social: string | null | undefined): SocialLink[] {
  if (!social) return [];

  const links: SocialLink[] = [];
  const seen = new Set<string>();

  // Split by common delimiters
  const parts = social
    .split(/[,\/&]|\s+and\s+/i)
    .map((s) => s.trim())
    .filter(Boolean);

  for (const part of parts) {
    const link = parsePart(part);
    if (link && !seen.has(link.url)) {
      seen.add(link.url);
      links.push(link);
    }
  }

  return links;
}

function parsePart(raw: string): SocialLink | null {
  const cleaned = raw.trim();
  if (!cleaned) return null;

  // Remove common prefixes like "IG:", "Instagram:", "TikTok:"
  const withoutPrefix = cleaned
    .replace(/^(ig|instagram|tiktok|yt|youtube|twitter|x)\s*[:]\s*/i, "")
    .trim();

  // Check for full URLs
  if (/^https?:\/\//i.test(withoutPrefix)) {
    return parseUrl(withoutPrefix);
  }

  // Check for domain-like strings
  if (/\.(com|co|io|net|org|video|studio|me)($|\/)/i.test(withoutPrefix)) {
    const url = withoutPrefix.startsWith("http")
      ? withoutPrefix
      : `https://${withoutPrefix}`;
    return parseUrl(url);
  }

  // Check for @handle format
  const handleMatch = withoutPrefix.match(/^@?([\w.]+)$/);
  if (handleMatch) {
    const handle = handleMatch[1];

    // Determine platform from context
    const lcRaw = raw.toLowerCase();
    if (lcRaw.includes("tiktok")) {
      return {
        platform: "tiktok",
        handle: `@${handle}`,
        url: `https://tiktok.com/@${handle}`,
        label: `@${handle}`,
      };
    }
    if (lcRaw.includes("youtube") || lcRaw.includes("yt")) {
      return {
        platform: "youtube",
        handle: `@${handle}`,
        url: `https://youtube.com/@${handle}`,
        label: `@${handle}`,
      };
    }
    if (lcRaw.includes("twitter") || lcRaw.includes(" x ")) {
      return {
        platform: "twitter",
        handle: `@${handle}`,
        url: `https://twitter.com/${handle}`,
        label: `@${handle}`,
      };
    }

    // Default to Instagram (most common in this community)
    return {
      platform: "instagram",
      handle: `@${handle}`,
      url: `https://instagram.com/${handle}`,
      label: `@${handle}`,
    };
  }

  // Handle "IG & TikTok: handle" format
  const multiPlatform = withoutPrefix.match(
    /^([\w.]+)$/
  );
  if (multiPlatform) {
    return {
      platform: "instagram",
      handle: `@${multiPlatform[1]}`,
      url: `https://instagram.com/${multiPlatform[1]}`,
      label: `@${multiPlatform[1]}`,
    };
  }

  return null;
}

function parseUrl(urlStr: string): SocialLink | null {
  try {
    const url = new URL(urlStr);
    const host = url.hostname.replace("www.", "");

    if (host.includes("instagram.com")) {
      const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
      return {
        platform: "instagram",
        handle: `@${handle}`,
        url: urlStr,
        label: `@${handle}`,
      };
    }

    if (host.includes("tiktok.com")) {
      const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
      return {
        platform: "tiktok",
        handle: handle.startsWith("@") ? handle : `@${handle}`,
        url: urlStr,
        label: handle.startsWith("@") ? handle : `@${handle}`,
      };
    }

    if (host.includes("youtube.com") || host.includes("youtu.be")) {
      const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
      return {
        platform: "youtube",
        handle,
        url: urlStr,
        label: handle,
      };
    }

    if (host.includes("twitter.com") || host.includes("x.com")) {
      const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
      return {
        platform: "twitter",
        handle: `@${handle}`,
        url: urlStr,
        label: `@${handle}`,
      };
    }

    if (host.includes("linkedin.com")) {
      const path = url.pathname.replace(/^\/in\//, "").replace(/^\/company\//, "").replace(/\/$/, "");
      return {
        platform: "linkedin",
        handle: path,
        url: urlStr,
        label: path,
      };
    }

    if (host.includes("facebook.com") || host.includes("fb.com")) {
      const handle = url.pathname.replace(/^\//, "").replace(/\/$/, "");
      return {
        platform: "facebook",
        handle,
        url: urlStr,
        label: handle,
      };
    }

    return {
      platform: "website",
      handle: host,
      url: urlStr,
      label: host,
    };
  } catch {
    return null;
  }
}

export function getPlatformIcon(platform: SocialLink["platform"]): string {
  switch (platform) {
    case "instagram":
      return "IG";
    case "tiktok":
      return "TT";
    case "youtube":
      return "YT";
    case "twitter":
      return "X";
    case "linkedin":
      return "LI";
    case "facebook":
      return "FB";
    case "website":
      return "WEB";
    default:
      return "LINK";
  }
}

export function getPlatformColor(platform: SocialLink["platform"]): string {
  switch (platform) {
    case "instagram":
      return "var(--color-coral)";
    case "tiktok":
      return "var(--color-sky)";
    case "youtube":
      return "var(--color-coral-deep)";
    case "twitter":
      return "var(--color-sky)";
    case "linkedin":
      return "#0A66C2";
    case "facebook":
      return "#1877F2";
    case "website":
      return "var(--color-lime)";
    default:
      return "var(--color-mist)";
  }
}
