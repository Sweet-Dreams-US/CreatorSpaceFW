import Link from "next/link";
import { getAdminStats, getPlatformUpdates } from "@/app/actions/admin";
import { getAllEvents } from "@/app/actions/events";
import ChangelogPanel from "./ChangelogPanel";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [stats, events, updates] = await Promise.all([
    getAdminStats(),
    getAllEvents(),
    getPlatformUpdates(),
  ]);
  const upcomingEvents = events.filter(
    (e) => new Date(e.date) >= new Date()
  ).slice(0, 3);

  return (
    <div className="max-w-6xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
        DASHBOARD
      </h1>
      <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
        Creator Space Fort Wayne — Admin Overview
      </p>

      {/* Stats Grid */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Creators" value={stats.totalCreators} color="coral" />
        <StatCard label="Claimed" value={stats.claimedCreators} color="lime" />
        <StatCard label="Unclaimed" value={stats.unclaimedCreators} color="sky" />
        <StatCard label="Invites Sent" value={stats.invitesSent} color="violet" />
        <StatCard label="Events" value={stats.totalEvents} color="coral" />
        <StatCard label="Total RSVPs" value={stats.totalRsvps} color="lime" />
      </div>

      {/* Quick Actions */}
      <div className="mt-10">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
          QUICK ACTIONS
        </h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <QuickLink href="/admin/creators" label="Manage Creators" />
          <QuickLink href="/admin/events" label="Create Event" />
          <QuickLink href="/admin/invites" label="Send Invites" />
          <QuickLink href="/admin/announcements" label="Send Announcement" />
        </div>
      </div>

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            UPCOMING EVENTS
          </h2>
          <div className="mt-4 space-y-3">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-5 py-4"
              >
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-white)]">
                    {event.title}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}{" "}
                    — {event.location || "TBD"}
                  </p>
                </div>
                <Link
                  href="/admin/events"
                  className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] hover:underline"
                >
                  Edit →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Platform Updates / Changelog */}
      <ChangelogPanel updates={updates} />

      {/* Recent Signups */}
      {stats.recentSignups.length > 0 && (
        <div className="mt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            RECENT SIGNUPS
          </h2>
          <div className="mt-4 space-y-2">
            {stats.recentSignups.map((creator) => (
              <div
                key={creator.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-3"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-charcoal)] font-[family-name:var(--font-display)] text-xs text-[var(--color-coral)]">
                  {(creator.first_name?.[0] || "")}{(creator.last_name?.[0] || "")}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
                    {creator.first_name} {creator.last_name}
                  </p>
                  <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                    {creator.email}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] p-5">
      <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
        {label}
      </p>
      <p
        className="mt-2 font-[family-name:var(--font-display)] text-3xl"
        style={{ color: `var(--color-${color})` }}
      >
        {value}
      </p>
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full border border-[var(--color-ash)] px-5 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all duration-200 hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
    >
      {label}
    </Link>
  );
}
