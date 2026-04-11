"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getAllEvents,
  getRsvpCountsBatch,
  getEventAttendees,
} from "@/app/actions/events";

interface Event {
  id: string;
  title: string;
  description: string | null;
  date: string;
  location: string | null;
  image_url: string | null;
  max_capacity: number | null;
  facebook_url: string | null;
  created_at: string;
}

export default function AdminEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [rsvpCounts, setRsvpCounts] = useState<Record<string, number>>({});
  const [expandedRsvp, setExpandedRsvp] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attendees, setAttendees] = useState<Record<string, any[]>>({});
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const loadEvents = useCallback(async () => {
    const data = await getAllEvents();
    setEvents(data as Event[]);
    setLoading(false);

    // Load RSVP counts (batch)
    const eventIds = data.map((e: { id: string }) => e.id);
    const counts = await getRsvpCountsBatch(eventIds);
    setRsvpCounts(counts);
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this event?")) return;
    await deleteEvent(id);
    setMessage("Event deleted.");
    loadEvents();
  };

  const isPast = (date: string) => new Date(date) < new Date();

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            EVENTS
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Create and manage community events
          </p>
        </div>
        <button
          onClick={() => {
            setEditingEvent(null);
            setShowForm(true);
          }}
          className="rounded-full bg-[var(--color-coral)] px-5 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
        >
          + New Event
        </button>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            ×
          </button>
        </div>
      )}

      {/* Events List */}
      <div className="mt-8 space-y-4">
        {loading ? (
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Loading...</p>
        ) : events.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-ash)] py-16 text-center">
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-smoke)]">
              NO EVENTS YET
            </p>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Create your first event to get started.
            </p>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className={`rounded-lg border bg-[var(--color-dark)] p-6 transition-all ${
                isPast(event.date)
                  ? "border-[var(--color-ash)]/50 opacity-60"
                  : "border-[var(--color-ash)]"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                      {event.title}
                    </h3>
                    {isPast(event.date) && (
                      <span className="rounded-full bg-[var(--color-smoke)]/15 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                        PAST
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                    <span>
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" at "}
                      {new Date(event.date).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                    {event.location && <span>— {event.location}</span>}
                  </div>
                  {event.description && (
                    <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)] line-clamp-2">
                      {event.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center gap-4">
                    <button
                      onClick={async () => {
                        if (expandedRsvp === event.id) {
                          setExpandedRsvp(null);
                          return;
                        }
                        if (!attendees[event.id]) {
                          const data = await getEventAttendees(event.id);
                          setAttendees((prev) => ({ ...prev, [event.id]: data }));
                        }
                        setExpandedRsvp(event.id);
                      }}
                      className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] underline decoration-dotted underline-offset-4 hover:text-[var(--color-white)]"
                    >
                      {rsvpCounts[event.id] || 0} RSVPs
                      {event.max_capacity ? ` / ${event.max_capacity} max` : ""}
                      {expandedRsvp === event.id ? " ▲" : " ▼"}
                    </button>
                  </div>
                  {/* RSVP List */}
                  {expandedRsvp === event.id && attendees[event.id] && (
                    <div className="mt-3 rounded-lg border border-[var(--color-ash)] bg-[var(--color-black)] p-3">
                      <p className="mb-2 font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                        RSVPd Creators
                      </p>
                      {attendees[event.id].length === 0 ? (
                        <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">No RSVPs yet</p>
                      ) : (
                        <div className="space-y-1.5">
                          {attendees[event.id].map((a, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
                                {a.first_name} {a.last_name}
                              </span>
                              <div className="flex items-center gap-2">
                                {a.email && (
                                  <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                                    {a.email}
                                  </span>
                                )}
                                <span className={`rounded-full px-2 py-0.5 font-[family-name:var(--font-mono)] text-[9px] uppercase ${
                                  a.rsvp_status === "checked_in" ? "bg-[var(--color-lime)]/15 text-[var(--color-lime)]"
                                  : a.rsvp_status === "confirmed" ? "bg-[var(--color-sky)]/15 text-[var(--color-sky)]"
                                  : a.rsvp_status === "waitlisted" ? "bg-[var(--color-violet)]/15 text-[var(--color-violet)]"
                                  : "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]"
                                }`}>
                                  {a.rsvp_status || "rsvpd"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingEvent(event);
                      setShowForm(true);
                    }}
                    className="rounded-full border border-[var(--color-ash)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)] transition-all hover:border-[var(--color-sky)]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="rounded-full border border-[var(--color-ash)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-xs text-red-400 transition-all hover:border-red-400"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Event Form Modal */}
      {showForm && (
        <EventFormModal
          event={editingEvent}
          onClose={() => {
            setShowForm(false);
            setEditingEvent(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingEvent(null);
            setMessage(editingEvent ? "Event updated." : "Event created.");
            loadEvents();
          }}
        />
      )}
    </div>
  );
}

function EventFormModal({
  event,
  onClose,
  onSaved,
}: {
  event: Event | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState({
    title: event?.title || "",
    description: event?.description || "",
    date: event?.date ? new Date(event.date).toISOString().slice(0, 16) : "",
    location: event?.location || "",
    max_capacity: event?.max_capacity?.toString() || "",
    facebook_url: event?.facebook_url || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim() || !data.date) {
      setError("Title and date are required.");
      return;
    }

    setSaving(true);
    const payload = {
      title: data.title,
      description: data.description || undefined,
      date: new Date(data.date).toISOString(),
      location: data.location || undefined,
      max_capacity: data.max_capacity ? parseInt(data.max_capacity) : undefined,
      facebook_url: data.facebook_url || undefined,
    };

    const result = event
      ? await updateEvent(event.id, payload)
      : await createEvent(payload);

    if (result.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
          {event ? "EDIT EVENT" : "NEW EVENT"}
        </h2>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            placeholder="Event Title *"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className={inputClass}
          />
          <input
            type="datetime-local"
            value={data.date}
            onChange={(e) => setData({ ...data, date: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Location"
            value={data.location}
            onChange={(e) => setData({ ...data, location: e.target.value })}
            className={inputClass}
          />
          <textarea
            placeholder="Description"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={3}
            className={`${inputClass} resize-none`}
          />
          <input
            type="number"
            placeholder="Max Capacity (optional)"
            value={data.max_capacity}
            onChange={(e) => setData({ ...data, max_capacity: e.target.value })}
            className={inputClass}
          />
          <input
            placeholder="Facebook Event URL (optional)"
            value={data.facebook_url}
            onChange={(e) => setData({ ...data, facebook_url: e.target.value })}
            className={inputClass}
          />

          {error && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
            >
              {saving ? "Saving..." : event ? "Update Event" : "Create Event"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[var(--color-ash)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
