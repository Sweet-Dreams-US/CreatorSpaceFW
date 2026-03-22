"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: "◆" },
  { href: "/admin/creators", label: "Creators", icon: "◉" },
  { href: "/admin/events", label: "Events", icon: "◈" },
  { href: "/admin/invites", label: "Invites", icon: "◇" },
  { href: "/admin/announcements", label: "Announcements", icon: "◎" },
  { href: "/admin/analytics", label: "Analytics", icon: "◫" },
  { href: "/admin/settings", label: "Settings", icon: "◐" },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-[var(--color-ash)] bg-[var(--color-dark)]">
      {/* Header */}
      <div className="border-b border-[var(--color-ash)] px-6 py-5">
        <Link href="/" className="group">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)] transition-colors group-hover:text-[var(--color-coral)]">
            CREATOR SPACE
          </p>
          <p className="font-[family-name:var(--font-mono)] text-[10px] tracking-[3px] text-[var(--color-smoke)]">
            ADMIN PANEL
          </p>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
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
