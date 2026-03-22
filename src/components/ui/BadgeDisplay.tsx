interface BadgeConfig {
  label: string;
  icon: string;
  bg: string;
  text: string;
}

const BADGE_MAP: Record<string, BadgeConfig> = {
  founding_member: {
    label: "Founding Member",
    icon: "\u2B50",
    bg: "var(--color-coral)",
    text: "var(--color-black)",
  },
  "3yr_bash": {
    label: "3 Year Bash",
    icon: "\uD83C\uDF89",
    bg: "var(--color-violet)",
    text: "var(--color-white)",
  },
  "5_projects": {
    label: "5+ Projects",
    icon: "\uD83D\uDCC1",
    bg: "var(--color-sky)",
    text: "var(--color-black)",
  },
  verified: {
    label: "Verified",
    icon: "\u2713",
    bg: "var(--color-lime)",
    text: "var(--color-black)",
  },
  organizer: {
    label: "Organizer",
    icon: "\uD83D\uDCE3",
    bg: "var(--color-coral)",
    text: "var(--color-black)",
  },
};

function getBadgeConfig(badge: string): BadgeConfig {
  return (
    BADGE_MAP[badge] || {
      label: badge.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: "",
      bg: "var(--color-smoke)",
      text: "var(--color-black)",
    }
  );
}

interface BadgeDisplayProps {
  badges: string[];
  compact?: boolean;
}

export default function BadgeDisplay({
  badges,
  compact = false,
}: BadgeDisplayProps) {
  if (!badges || badges.length === 0) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {badges.map((badge) => {
          const config = getBadgeConfig(badge);
          return (
            <span
              key={badge}
              title={config.label}
              className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
              style={{ backgroundColor: config.bg, color: config.text }}
            >
              {config.icon}
            </span>
          );
        })}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badge) => {
        const config = getBadgeConfig(badge);
        return (
          <span
            key={badge}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-semibold"
            style={{ backgroundColor: config.bg, color: config.text }}
          >
            <span className="text-[11px]">{config.icon}</span>
            {config.label}
          </span>
        );
      })}
    </div>
  );
}
