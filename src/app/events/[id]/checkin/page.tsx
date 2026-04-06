"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { isAdmin } from "@/lib/admin";
import { getEventAttendees, getEventCheckInStats } from "@/app/actions/events";
import { getNextEvent } from "@/app/actions/events";
import { checkInToEvent, markNoShow, promoteFromWaitlist } from "@/app/actions/rsvp";

interface Attendee {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  auth_id: string;
  slug: string | null;
  rsvp_status: string;
  checked_in_at: string | null;
  rsvp_created_at: string | null;
}

interface Stats {
  confirmed: number;
  waitlisted: number;
  checked_in: number;
  no_show: number;
}

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user, loading: authLoading } = useAuth();

  const [authorized, setAuthorized] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [stats, setStats] = useState<Stats>({ confirmed: 0, waitlisted: 0, checked_in: 0, no_show: 0 });
  const [search, setSearch] = useState("");
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [markingNoShow, setMarkingNoShow] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/auth/login?next=/events/" + eventId + "/checkin");
      return;
    }
    // We check admin by email from the user object
    // The user object from AuthProvider should have email
    const userEmail = (user as { email?: string }).email;
    if (!isAdmin(userEmail)) {
      router.push("/");
      return;
    }
    setAuthorized(true);
  }, [user, authLoading, eventId, router]);

  const refreshData = useCallback(async () => {
    const [attendeeData, statsData] = await Promise.all([
      getEventAttendees(eventId),
      getEventCheckInStats(eventId),
    ]);
    setAttendees(attendeeData as Attendee[]);
    setStats(statsData);
  }, [eventId]);

  // Load event info and attendees
  useEffect(() => {
    if (!authorized) return;

    refreshData();

    // Auto-refresh every 15 seconds for live updates
    const interval = setInterval(refreshData, 15000);
    return () => clearInterval(interval);
  }, [authorized, eventId, refreshData]);

  const handleCheckIn = async (attendee: Attendee) => {
    setCheckingIn(attendee.auth_id);
    const result = await checkInToEvent(attendee.auth_id, eventId);
    if (result.success) {
      setLastAction(`${attendee.first_name || "Attendee"} checked in`);

      // If this was a waitlisted person, try promoting next in line
      if (attendee.rsvp_status === "waitlisted") {
        await promoteFromWaitlist(eventId);
      }
    }
    await refreshData();
    setCheckingIn(null);
    setTimeout(() => setLastAction(null), 3000);
  };

  const handleMarkNoShow = async () => {
    if (!confirm("Mark all non-checked-in confirmed RSVPs as no-show? This will also promote waitlisted attendees to fill open spots.")) {
      return;
    }
    setMarkingNoShow(true);
    const result = await markNoShow(eventId);
    if (result.success) {
      // Promote from waitlist to fill the spots
      await promoteFromWaitlist(eventId);
      setLastAction(`${result.markedCount} attendees marked as no-show`);
    }
    await refreshData();
    setMarkingNoShow(false);
    setTimeout(() => setLastAction(null), 4000);
  };

  const filtered = attendees.filter((a) => {
    if (!search) return true;
    const name = `${a.first_name || ""} ${a.last_name || ""} ${a.email || ""}`.toLowerCase();
    return name.includes(search.toLowerCase());
  });

  // Sort: checked_in first, then confirmed, then waitlisted, then no_show
  const statusOrder: Record<string, number> = { checked_in: 0, confirmed: 1, waitlisted: 2, no_show: 3 };
  const sorted = [...filtered].sort(
    (a, b) => (statusOrder[a.rsvp_status] ?? 4) - (statusOrder[b.rsvp_status] ?? 4)
  );

  const statusColor = (status: string) => {
    switch (status) {
      case "checked_in": return "bg-emerald-500";
      case "confirmed": return "bg-amber-400";
      case "waitlisted": return "bg-blue-500";
      case "no_show": return "bg-red-500/60";
      default: return "bg-neutral-500";
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case "checked_in": return "CHECKED IN";
      case "confirmed": return "CONFIRMED";
      case "waitlisted": return "WAITLISTED";
      case "no_show": return "NO SHOW";
      default: return status.toUpperCase();
    }
  };

  if (authLoading || !authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-700 border-t-white" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Event Check-In</h1>
              <p className="mt-1 text-sm text-neutral-400">
                Tap a name to check them in
              </p>
            </div>
            <button
              onClick={handleMarkNoShow}
              disabled={markingNoShow}
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-3 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/20 active:bg-red-500/30 disabled:opacity-50"
            >
              {markingNoShow ? "Processing..." : "Mark No-Shows"}
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-4 grid grid-cols-4 gap-2">
            <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-emerald-400">{stats.checked_in}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-400/60">Checked In</div>
            </div>
            <div className="rounded-xl bg-amber-400/10 p-3 text-center">
              <div className="text-2xl font-bold text-amber-300">{stats.confirmed}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-amber-300/60">Confirmed</div>
            </div>
            <div className="rounded-xl bg-blue-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.waitlisted}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-blue-400/60">Waitlisted</div>
            </div>
            <div className="rounded-xl bg-red-500/10 p-3 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.no_show}</div>
              <div className="text-[10px] font-medium uppercase tracking-wider text-red-400/60">No Show</div>
            </div>
          </div>

          {/* Search */}
          <div className="mt-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-neutral-700 bg-neutral-900 px-5 py-4 text-lg text-white placeholder-neutral-500 outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500"
              autoFocus
            />
          </div>
        </div>
      </div>

      {/* Toast */}
      {lastAction && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-emerald-500/20">
          {lastAction}
        </div>
      )}

      {/* Attendee list */}
      <div className="mx-auto max-w-4xl px-4 py-4">
        {sorted.length === 0 ? (
          <div className="py-20 text-center text-neutral-500">
            {search ? "No attendees match your search" : "No RSVPs yet"}
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((attendee) => {
              const isCheckedIn = attendee.rsvp_status === "checked_in";
              const isNoShow = attendee.rsvp_status === "no_show";
              const isProcessing = checkingIn === attendee.auth_id;
              const canCheckIn = !isCheckedIn && !isNoShow;

              return (
                <button
                  key={attendee.id}
                  onClick={() => canCheckIn && handleCheckIn(attendee)}
                  disabled={!canCheckIn || isProcessing}
                  className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.98] ${
                    isCheckedIn
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : isNoShow
                        ? "border-neutral-800 bg-neutral-900/30 opacity-50"
                        : "border-neutral-800 bg-neutral-900 hover:border-neutral-600 hover:bg-neutral-800"
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    {attendee.avatar_url ? (
                      <img
                        src={attendee.avatar_url}
                        alt=""
                        className="h-14 w-14 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-700 text-xl font-bold text-neutral-300">
                        {(attendee.first_name?.[0] || "?").toUpperCase()}
                      </div>
                    )}
                    {/* Status dot */}
                    <div
                      className={`absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full border-2 border-neutral-950 ${statusColor(attendee.rsvp_status)}`}
                    />
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-lg font-medium text-white">
                        {attendee.first_name || ""} {attendee.last_name || ""}
                      </span>
                    </div>
                    {attendee.email && (
                      <p className="truncate text-sm text-neutral-500">{attendee.email}</p>
                    )}
                  </div>

                  {/* Status / Action */}
                  <div className="flex-shrink-0">
                    {isProcessing ? (
                      <div className="flex h-12 w-28 items-center justify-center rounded-xl bg-neutral-700">
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-500 border-t-white" />
                      </div>
                    ) : isCheckedIn ? (
                      <div className="flex h-12 w-28 items-center justify-center rounded-xl bg-emerald-500/20 text-sm font-bold text-emerald-400">
                        {statusLabel(attendee.rsvp_status)}
                      </div>
                    ) : isNoShow ? (
                      <div className="flex h-12 w-28 items-center justify-center rounded-xl bg-red-500/10 text-sm font-bold text-red-400/60">
                        NO SHOW
                      </div>
                    ) : (
                      <div
                        className={`flex h-12 w-28 items-center justify-center rounded-xl text-sm font-bold ${
                          attendee.rsvp_status === "waitlisted"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-400/20 text-amber-300"
                        }`}
                      >
                        CHECK IN
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
