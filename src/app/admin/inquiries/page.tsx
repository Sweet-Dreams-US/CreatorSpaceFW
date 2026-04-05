"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getInquiries,
  updateInquiryStatus,
  updateInquiryNotes,
  referCreators,
} from "@/app/actions/inquiries";
import { getAllCreatorsAdmin } from "@/app/actions/admin";

interface Inquiry {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  project_description: string;
  budget_range: string | null;
  timeline: string | null;
  creator_types: string[];
  status: string;
  admin_notes: string | null;
  referred_creators: string[] | null;
  created_at: string;
  updated_at: string | null;
}

interface Creator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  skills: string | null;
}

const STATUS_TABS = ["all", "new", "reviewing", "referred", "completed", "closed"] as const;

const STATUS_COLORS: Record<string, string> = {
  new: "bg-[var(--color-coral)]/15 text-[var(--color-coral)]",
  reviewing: "bg-[var(--color-sky)]/15 text-[var(--color-sky)]",
  referred: "bg-[var(--color-violet)]/15 text-[var(--color-violet)]",
  completed: "bg-[var(--color-lime)]/15 text-[var(--color-lime)]",
  closed: "bg-[var(--color-smoke)]/15 text-[var(--color-smoke)]",
};

export default function AdminInquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // Inline edit states
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});
  const [editStatus, setEditStatus] = useState<Record<string, string>>({});
  const [savingNotes, setSavingNotes] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<string | null>(null);

  // Refer creators state
  const [referringId, setReferringId] = useState<string | null>(null);
  const [selectedCreators, setSelectedCreators] = useState<Set<string>>(new Set());
  const [creatorSearch, setCreatorSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [data, allCreators] = await Promise.all([
      getInquiries(statusFilter),
      getAllCreatorsAdmin(),
    ]);
    setInquiries(data as Inquiry[]);
    setCreators(allCreators as Creator[]);

    // Initialize edit states
    const notes: Record<string, string> = {};
    const statuses: Record<string, string> = {};
    for (const inq of data as Inquiry[]) {
      notes[inq.id] = inq.admin_notes || "";
      statuses[inq.id] = inq.status;
    }
    setEditNotes(notes);
    setEditStatus(statuses);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveNotes = async (id: string) => {
    setSavingNotes(id);
    const result = await updateInquiryNotes(id, editNotes[id] || "");
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Notes saved.");
    }
    setSavingNotes(null);
  };

  const handleChangeStatus = async (id: string) => {
    setSavingStatus(id);
    const result = await updateInquiryStatus(id, editStatus[id]);
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Status updated.");
      load();
    }
    setSavingStatus(null);
  };

  const handleReferCreators = async (inquiryId: string) => {
    if (selectedCreators.size === 0) return;
    const result = await referCreators(inquiryId, Array.from(selectedCreators));
    if (result.error) {
      setMessage(`Error: ${result.error}`);
    } else {
      setMessage("Creators referred.");
      setReferringId(null);
      setSelectedCreators(new Set());
      load();
    }
  };

  const toggleCreatorSelect = (id: string) => {
    setSelectedCreators((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredCreators = creators.filter((c) => {
    if (!creatorSearch) return true;
    return `${c.first_name} ${c.last_name} ${c.skills}`
      .toLowerCase()
      .includes(creatorSearch.toLowerCase());
  });

  const getReferredCreatorNames = (ids: string[] | null) => {
    if (!ids || ids.length === 0) return null;
    return ids
      .map((id) => {
        const c = creators.find((cr) => cr.id === id);
        return c ? `${c.first_name} ${c.last_name}` : "Unknown";
      })
      .join(", ");
  };

  return (
    <div className="max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            INQUIRIES
          </h1>
          <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            Business inquiries from potential clients
          </p>
        </div>
      </div>

      {message && (
        <div className="mt-4 rounded-lg border border-[var(--color-lime)]/30 bg-[var(--color-lime)]/10 px-4 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
          {message}
          <button onClick={() => setMessage("")} className="ml-3 opacity-60 hover:opacity-100">
            x
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="mt-6 flex gap-2">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => {
              setStatusFilter(tab);
              setExpandedId(null);
            }}
            className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs capitalize transition-all ${
              statusFilter === tab
                ? "bg-[var(--color-coral)]/15 text-[var(--color-coral)]"
                : "text-[var(--color-smoke)] hover:text-[var(--color-mist)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-lg border border-[var(--color-ash)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-ash)] bg-[var(--color-dark)]">
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Business
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Contact
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Email
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Creator Types
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Status
              </th>
              <th className="px-3 py-3 text-left font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                Date
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  Loading...
                </td>
              </tr>
            ) : inquiries.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]"
                >
                  No inquiries found.
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <InquiryRow
                  key={inquiry.id}
                  inquiry={inquiry}
                  isExpanded={expandedId === inquiry.id}
                  onToggle={() =>
                    setExpandedId(expandedId === inquiry.id ? null : inquiry.id)
                  }
                  editNotes={editNotes[inquiry.id] || ""}
                  onNotesChange={(val) =>
                    setEditNotes((prev) => ({ ...prev, [inquiry.id]: val }))
                  }
                  onSaveNotes={() => handleSaveNotes(inquiry.id)}
                  savingNotes={savingNotes === inquiry.id}
                  editStatusVal={editStatus[inquiry.id] || inquiry.status}
                  onStatusChange={(val) =>
                    setEditStatus((prev) => ({ ...prev, [inquiry.id]: val }))
                  }
                  onChangeStatus={() => handleChangeStatus(inquiry.id)}
                  savingStatus={savingStatus === inquiry.id}
                  referredNames={getReferredCreatorNames(inquiry.referred_creators)}
                  isReferring={referringId === inquiry.id}
                  onStartRefer={() => {
                    setReferringId(inquiry.id);
                    setSelectedCreators(
                      new Set(inquiry.referred_creators || [])
                    );
                  }}
                  onCancelRefer={() => {
                    setReferringId(null);
                    setSelectedCreators(new Set());
                    setCreatorSearch("");
                  }}
                  onConfirmRefer={() => handleReferCreators(inquiry.id)}
                  filteredCreators={filteredCreators}
                  selectedCreators={selectedCreators}
                  onToggleCreator={toggleCreatorSelect}
                  creatorSearch={creatorSearch}
                  onCreatorSearchChange={setCreatorSearch}
                  formatDate={formatDate}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InquiryRow({
  inquiry,
  isExpanded,
  onToggle,
  editNotes,
  onNotesChange,
  onSaveNotes,
  savingNotes,
  editStatusVal,
  onStatusChange,
  onChangeStatus,
  savingStatus,
  referredNames,
  isReferring,
  onStartRefer,
  onCancelRefer,
  onConfirmRefer,
  filteredCreators,
  selectedCreators,
  onToggleCreator,
  creatorSearch,
  onCreatorSearchChange,
  formatDate,
}: {
  inquiry: Inquiry;
  isExpanded: boolean;
  onToggle: () => void;
  editNotes: string;
  onNotesChange: (v: string) => void;
  onSaveNotes: () => void;
  savingNotes: boolean;
  editStatusVal: string;
  onStatusChange: (v: string) => void;
  onChangeStatus: () => void;
  savingStatus: boolean;
  referredNames: string | null;
  isReferring: boolean;
  onStartRefer: () => void;
  onCancelRefer: () => void;
  onConfirmRefer: () => void;
  filteredCreators: Creator[];
  selectedCreators: Set<string>;
  onToggleCreator: (id: string) => void;
  creatorSearch: string;
  onCreatorSearchChange: (v: string) => void;
  formatDate: (d: string) => string;
}) {
  return (
    <>
      <tr
        onClick={onToggle}
        className="cursor-pointer border-b border-[var(--color-ash)]/50 transition-colors hover:bg-[var(--color-dark)]"
      >
        <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)]">
          {inquiry.business_name}
        </td>
        <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
          {inquiry.contact_name}
        </td>
        <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
          {inquiry.email}
        </td>
        <td className="px-3 py-3">
          <div className="flex flex-wrap gap-1">
            {inquiry.creator_types?.map((type) => (
              <span
                key={type}
                className="inline-block rounded-full bg-[var(--color-sky)]/10 px-2 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-sky)]"
              >
                {type}
              </span>
            ))}
          </div>
        </td>
        <td className="px-3 py-3">
          <span
            className={`inline-block rounded-full px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] font-semibold ${
              STATUS_COLORS[inquiry.status] || STATUS_COLORS.new
            }`}
          >
            {inquiry.status.toUpperCase()}
          </span>
        </td>
        <td className="px-3 py-3 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]">
          {formatDate(inquiry.created_at)}
        </td>
      </tr>

      {/* Expanded Detail Row */}
      {isExpanded && (
        <tr className="border-b border-[var(--color-ash)]/50">
          <td colSpan={6} className="bg-[var(--color-dark)]/50 px-6 py-5">
            <div className="space-y-5">
              {/* Project Description */}
              <div>
                <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Project Description
                </label>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
                  {inquiry.project_description}
                </p>
              </div>

              {/* Budget & Timeline */}
              <div className="flex gap-6">
                {inquiry.budget_range && (
                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                      Budget
                    </label>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
                      {inquiry.budget_range}
                    </p>
                  </div>
                )}
                {inquiry.timeline && (
                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                      Timeline
                    </label>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {inquiry.timeline}
                    </p>
                  </div>
                )}
                {inquiry.phone && (
                  <div>
                    <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                      Phone
                    </label>
                    <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {inquiry.phone}
                    </p>
                  </div>
                )}
              </div>

              {/* Admin Notes */}
              <div>
                <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Admin Notes
                </label>
                <div className="mt-1 flex gap-2">
                  <textarea
                    value={editNotes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows={3}
                    placeholder="Internal notes..."
                    className="flex-1 rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors"
                  />
                  <button
                    onClick={onSaveNotes}
                    disabled={savingNotes}
                    className="self-end rounded-full bg-[var(--color-coral)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
                  >
                    {savingNotes ? "..." : "Save"}
                  </button>
                </div>
              </div>

              {/* Status Change */}
              <div>
                <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Change Status
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <select
                    value={editStatusVal}
                    onChange={(e) => onStatusChange(e.target.value)}
                    className="rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none focus:border-[var(--color-coral)]"
                  >
                    {["new", "reviewing", "referred", "completed", "closed"].map(
                      (s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      )
                    )}
                  </select>
                  <button
                    onClick={onChangeStatus}
                    disabled={savingStatus}
                    className="rounded-full border border-[var(--color-ash)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)] disabled:opacity-50"
                  >
                    {savingStatus ? "..." : "Change"}
                  </button>
                </div>
              </div>

              {/* Referred Creators */}
              <div>
                <label className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-[var(--color-smoke)]">
                  Referred Creators
                </label>
                {referredNames ? (
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-violet)]">
                    {referredNames}
                  </p>
                ) : (
                  <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                    None yet
                  </p>
                )}

                {!isReferring ? (
                  <button
                    onClick={onStartRefer}
                    className="mt-2 rounded-full border border-[var(--color-ash)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-all hover:border-[var(--color-violet)] hover:text-[var(--color-violet)]"
                  >
                    Refer Creators
                  </button>
                ) : (
                  <div className="mt-2 rounded-lg border border-[var(--color-violet)]/30 bg-[var(--color-violet)]/5 p-4">
                    <input
                      type="text"
                      placeholder="Search creators..."
                      value={creatorSearch}
                      onChange={(e) => onCreatorSearchChange(e.target.value)}
                      className="w-full rounded-lg border border-[var(--color-ash)] bg-[var(--color-dark)] px-3 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-violet)]"
                    />
                    <div className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {filteredCreators.slice(0, 20).map((c) => (
                        <label
                          key={c.id}
                          className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 transition-colors hover:bg-[var(--color-dark)]"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCreators.has(c.id)}
                            onChange={() => onToggleCreator(c.id)}
                            className="accent-[var(--color-violet)]"
                          />
                          <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-white)]">
                            {c.first_name} {c.last_name}
                          </span>
                          {c.skills && (
                            <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                              {c.skills.split(",").slice(0, 2).join(", ")}
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={onConfirmRefer}
                        disabled={selectedCreators.size === 0}
                        className="rounded-full bg-[var(--color-violet)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-white)] transition-all hover:scale-105 disabled:opacity-50"
                      >
                        Refer {selectedCreators.size} Creator{selectedCreators.size !== 1 ? "s" : ""}
                      </button>
                      <button
                        onClick={onCancelRefer}
                        className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] hover:text-[var(--color-white)]"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
