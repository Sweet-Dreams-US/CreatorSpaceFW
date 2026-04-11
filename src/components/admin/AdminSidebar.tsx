"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  adminOnly?: boolean; // Only visible to full admins, not board members
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: "◆" },
  { href: "/admin/creators", label: "Creators", icon: "◉" },
  { href: "/admin/events", label: "Events", icon: "◈" },
  { href: "/admin/invites", label: "Invites", icon: "◇", adminOnly: true },
  { href: "/admin/announcements", label: "Announcements", icon: "◎", adminOnly: true },
  { href: "/admin/collaborate", label: "Collab Board", icon: "◫" },
  { href: "/admin/resources", label: "Resources", icon: "◇" },
  { href: "/admin/challenges", label: "Challenges", icon: "◈" },
  { href: "/admin/inquiries", label: "Inquiries", icon: "✦" },
  { href: "/admin/spotlight", label: "Spotlight", icon: "★" },
  { href: "/admin/feedback", label: "Feedback", icon: "◬" },
  { href: "/admin/analytics", label: "Analytics", icon: "◉" },
  { href: "/admin/settings", label: "Settings", icon: "◐", adminOnly: true },
];

interface AdminSidebarProps {
  userRole?: string | null;
}

export default function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname();
  const isFullAdmin = userRole === "admin";

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.adminOnly || isFullAdmin
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--color-ash)] bg-[var(--color-dark)]">
      {/* Header */}
      <div className="border-b border-[var(--color-ash)] px-6 py-5">
        <Link href="/" className="group">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)] transition-colors group-hover:text-[var(--color-coral)]">
            CREATOR SPACE
          </p>
          <div className="flex items-center gap-2">
            <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[3px] text-[var(--color-smoke)]">
              ADMIN PANEL
            </p>
            {userRole === "board" && (
              <span className="rounded-full bg-[var(--color-violet)]/15 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[8px] uppercase tracking-wider text-[var(--color-violet)]">
                Board
              </span>
            )}
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {visibleItems.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-[family-name:var(--font-mono)] text-sm transition-all duration-200 ${
                    isActive
                      ? "bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
                      : "text-[var(--color-mist)] hover:bg-[var(--color-ash)]/50 hover:text-[var(--color-white)]"
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-ash)] px-6 py-4">
        <Link
          href="/directory"
          className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          ← Back to Directory
        </Link>
      </div>
    </aside>
  );
}
