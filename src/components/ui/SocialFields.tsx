"use client";

import { useState, useEffect } from "react";

const PLATFORMS = [
  { key: "instagram", label: "Instagram", prefix: "https://instagram.com/", placeholder: "@handle" },
  { key: "tiktok", label: "TikTok", prefix: "https://tiktok.com/@", placeholder: "@handle" },
  { key: "youtube", label: "YouTube", prefix: "https://youtube.com/@", placeholder: "@handle or channel URL" },
  { key: "twitter", label: "X / Twitter", prefix: "https://x.com/", placeholder: "@handle" },
  { key: "linkedin", label: "LinkedIn", prefix: "https://linkedin.com/in/", placeholder: "profile URL or slug" },
  { key: "facebook", label: "Facebook", prefix: "https://facebook.com/", placeholder: "page or profile URL" },
] as const;

interface SocialFieldsProps {
  defaultValue: string | null;
  inputClass: string;
}

function parseSocialToFields(social: string | null): Record<string, string> {
  const fields: Record<string, string> = {};
  if (!social) return fields;

  // Split by comma, newline, or multiple spaces
  const parts = social.split(/[,\n]|\s{2,}/).map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    const lower = part.toLowerCase();

    if (lower.includes("instagram.com") || lower.includes("ig:")) {
      fields.instagram = part;
    } else if (lower.includes("tiktok.com")) {
      fields.tiktok = part;
    } else if (lower.includes("youtube.com") || lower.includes("youtu.be")) {
      fields.youtube = part;
    } else if (lower.includes("twitter.com") || lower.includes("x.com")) {
      fields.twitter = part;
    } else if (lower.includes("linkedin.com")) {
      fields.linkedin = part;
    } else if (lower.includes("facebook.com") || lower.includes("fb.com")) {
      fields.facebook = part;
    } else if (part.startsWith("@") || /^[\w.]+$/.test(part)) {
      // Bare handle — default to instagram if not taken
      if (!fields.instagram) {
        fields.instagram = part;
      }
    }
  }

  return fields;
}

const PLATFORM_PREFIXES: Record<string, string> = {
  instagram: "https://instagram.com/",
  tiktok: "https://tiktok.com/@",
  youtube: "https://youtube.com/@",
  twitter: "https://x.com/",
  linkedin: "https://linkedin.com/in/",
  facebook: "https://facebook.com/",
};

function normalizeField(key: string, value: string): string {
  const v = value.trim();
  if (!v) return "";
  // If it's already a full URL, keep as-is
  if (/^https?:\/\//i.test(v)) return v;
  // Strip leading @ for URL construction
  const handle = v.replace(/^@/, "");
  const prefix = PLATFORM_PREFIXES[key];
  return prefix ? `${prefix}${handle}` : v;
}

function fieldsToSocialString(fields: Record<string, string>): string {
  return Object.entries(fields)
    .map(([key, value]) => normalizeField(key, value))
    .filter(Boolean)
    .join(", ");
}

export default function SocialFields({ defaultValue, inputClass }: SocialFieldsProps) {
  const [fields, setFields] = useState<Record<string, string>>(() =>
    parseSocialToFields(defaultValue)
  );

  const [combinedValue, setCombinedValue] = useState(() =>
    fieldsToSocialString(parseSocialToFields(defaultValue))
  );

  useEffect(() => {
    setCombinedValue(fieldsToSocialString(fields));
  }, [fields]);

  const updateField = (key: string, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-3">
      <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] uppercase tracking-wider">
        Social Links
      </p>
      {PLATFORMS.map((platform) => (
        <div key={platform.key} className="flex items-center gap-3">
          <span className="w-20 shrink-0 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
            {platform.label}
          </span>
          <input
            type="text"
            value={fields[platform.key] || ""}
            onChange={(e) => updateField(platform.key, e.target.value)}
            placeholder={platform.placeholder}
            className={inputClass}
          />
        </div>
      ))}
      {/* Hidden field that combines all socials for the form */}
      <input type="hidden" name="social" value={combinedValue} />
    </div>
  );
}
