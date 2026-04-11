"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import CommunityNav from "@/components/ui/CommunityNav";
import { useAuth } from "@/components/providers/AuthProvider";
import { getMyNotifications, markAsRead, markAllAsRead } from "@/app/actions/notifications";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, string> = {
  connection_request: "Connect",
  connection_accepted: "Connected",
  collab_response: "Collab",
  collab_accepted: "Accepted",
  collab_declined: "Declined",
  inquiry_referral: "Job Lead",
  event_update: "Event",
  challenge: "Challenge",
  general: "Update",
};

const TYPE_COLORS: Record<string, string> = {
  connection_request: "var(--color-violet)",
  connection_accepted: "var(--color-lime)",
  collab_response: "var(--color-sky)",
  collab_accepted: "var(--color-lime)",
  collab_declined: "var(--color-smoke)",
  inquiry_referral: "var(--color-coral)",
  event_update: "var(--color-sky)",
  challenge: "var(--color-violet)",
  general: "var(--color-mist)",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getMyNotifications().then((data) => {
      setNotifications(data as Notification[]);
      setLoading(false);
    });
  }, [user]);

  if (authLoading) return null;

  if (!user) {
    return (
      <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
        <div className="mx-auto max-w-3xl">
          <CommunityNav />
          <div className="mt-24 text-center">
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              <Link href="/auth/login" className="text-[var(--color-coral)] hover:underline">Sign in</Link> to view notifications.
            </p>
          </div>
        </div>
      </main>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 pb-24 pt-16">
      <div className="relative z-10 mx-auto max-w-3xl">
        <CommunityNav />

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)]">
              NOTIFICATIONS
            </h1>
            {unreadCount > 0 && (
              <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-coral)]">
                {unreadCount} unread
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={async () => {
                await markAllAsRead();
                setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
              }}
              className="rounded-full border border-[var(--color-ash)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
            >
              Mark all read
            </button>
          )}
        </div>

        <div className="mt-8 space-y-2">
          {loading ? (
            <p className="py-12 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Loading...</p>
          ) : notifications.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-[var(--color-dark)] p-10 text-center">
              <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                No notifications yet. They'll show up here when someone connects, responds to your collab, or you get a job lead.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-4 rounded-xl border p-4 transition-all ${
                  notif.read
                    ? "border-white/5 bg-[var(--color-dark)]/50"
                    : "border-[var(--color-coral)]/15 bg-[var(--color-dark)]"
                }`}
                onClick={async () => {
                  if (!notif.read) {
                    await markAsRead(notif.id);
                    setNotifications((prev) =>
                      prev.map((n) => n.id === notif.id ? { ...n, read: true } : n)
                    );
                  }
                }}
              >
                {/* Type badge */}
                <span
                  className="mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[9px] font-semibold uppercase tracking-wider"
                  style={{
                    color: TYPE_COLORS[notif.type] || "var(--color-mist)",
                    backgroundColor: `color-mix(in srgb, ${TYPE_COLORS[notif.type] || "var(--color-mist)"} 10%, transparent)`,
                  }}
                >
                  {TYPE_ICONS[notif.type] || notif.type}
                </span>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className={`font-[family-name:var(--font-mono)] text-sm ${notif.read ? "text-[var(--color-mist)]" : "text-[var(--color-white)]"}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {notif.body}
                    </p>
                  )}
                  {notif.link && (
                    <Link
                      href={notif.link}
                      className="mt-1 inline-block font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-coral)] hover:underline"
                    >
                      View details →
                    </Link>
                  )}
                </div>

                {/* Time */}
                <span className="shrink-0 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                  {timeAgo(notif.created_at)}
                </span>

                {/* Unread dot */}
                {!notif.read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-coral)]" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
