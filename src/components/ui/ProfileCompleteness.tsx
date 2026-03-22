"use client";

import Link from "next/link";

interface CreatorForCompleteness {
  avatar_url: string | null;
  bio: string | null;
  skills: string;
  company: string | null;
  job_title: string | null;
  website: string | null;
  social: string | null;
  location?: string | null;
}

interface ProfileCompletenessProps {
  creator: CreatorForCompleteness;
}

interface MissingField {
  label: string;
  weight: number;
}

function calculateCompleteness(creator: CreatorForCompleteness): {
  percentage: number;
  missing: MissingField[];
} {
  let score = 0;
  const missing: MissingField[] = [];

  if (creator.avatar_url) {
    score += 20;
  } else {
    missing.push({ label: "Profile photo", weight: 20 });
  }

  if (creator.bio && creator.bio.trim().length > 0) {
    score += 20;
  } else {
    missing.push({ label: "Bio", weight: 20 });
  }

  const hasSkills =
    creator.skills &&
    creator.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean).length > 0;
  if (hasSkills) {
    score += 15;
  } else {
    missing.push({ label: "Skills", weight: 15 });
  }

  if (
    (creator.company && creator.company.trim().length > 0) ||
    (creator.job_title && creator.job_title.trim().length > 0)
  ) {
    score += 15;
  } else {
    missing.push({ label: "Company or job title", weight: 15 });
  }

  if (creator.website && creator.website.trim().length > 0) {
    score += 10;
  } else {
    missing.push({ label: "Website", weight: 10 });
  }

  if (creator.social && creator.social.trim().length > 0) {
    score += 10;
  } else {
    missing.push({ label: "Social link", weight: 10 });
  }

  if (creator.location && creator.location.trim().length > 0) {
    score += 10;
  } else {
    missing.push({ label: "Location", weight: 10 });
  }

  return { percentage: score, missing };
}

function getColor(percentage: number): string {
  if (percentage < 30) return "#ef4444"; // red
  if (percentage < 60) return "var(--color-coral)";
  return "var(--color-lime)";
}

export default function ProfileCompleteness({
  creator,
}: ProfileCompletenessProps) {
  const { percentage, missing } = calculateCompleteness(creator);
  const color = getColor(percentage);

  // SVG circle math
  const size = 96;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
      <div className="flex items-center gap-6">
        {/* Circular progress ring */}
        <div className="relative flex-shrink-0">
          <svg
            width={size}
            height={size}
            className="-rotate-90"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="var(--color-charcoal)"
              strokeWidth={strokeWidth}
            />
            {/* Progress circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              style={{
                transition: "stroke-dashoffset 0.6s ease-out, stroke 0.3s ease",
              }}
            />
          </svg>
          {/* Percentage text in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-[family-name:var(--font-display)] text-xl"
              style={{ color }}
            >
              {percentage}%
            </span>
          </div>
        </div>

        {/* Missing fields info */}
        <div className="flex flex-col gap-1.5">
          <p className="font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-white)]">
            Profile completeness
          </p>
          {missing.length > 0 ? (
            <>
              <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--color-smoke)]">
                Missing: {missing.map((m) => m.label).join(", ")}
              </p>
              <Link
                href="/profile/edit"
                className="mt-1 inline-block font-[family-name:var(--font-mono)] text-xs font-semibold transition-colors"
                style={{ color }}
              >
                Complete your profile →
              </Link>
            </>
          ) : (
            <p
              className="font-[family-name:var(--font-mono)] text-xs"
              style={{ color }}
            >
              Your profile is complete!
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
