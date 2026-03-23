"use client";

import { useState, useEffect, useRef } from "react";
import { joinCreatorDatabase } from "@/app/actions/creators";
import TurnstileWidget from "@/components/ui/TurnstileWidget";

const SKILL_OPTIONS = [
  "Video",
  "Photo",
  "Editor",
  "VFX",
  "Code",
  "Music",
  "Aerial",
  "Design",
  "Writing",
  "Audio Engineering",
  "Animation",
  "Marketing",
  "Business",
];

const MAX_SKILLS = 3;

interface JoinFormModalProps {
  open: boolean;
  onClose: () => void;
}

export default function JoinFormModal({ open, onClose }: JoinFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    social: "",
    company: "",
    job_title: "",
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [turnstileToken, setTurnstileToken] = useState("");

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (dropdownOpen) {
          setDropdownOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, dropdownOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setSuccess(false);
      setError("");
      setDropdownOpen(false);
    }
  }, [open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) {
        return prev.filter((s) => s !== skill);
      }
      if (prev.length >= MAX_SKILLS) return prev;
      return [...prev, skill];
    });
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills((prev) => prev.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedSkills.length === 0) {
      setError("Please select at least one skill.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await joinCreatorDatabase({
      ...form,
      skills: selectedSkills.join(", "),
      turnstileToken,
    });

    setLoading(false);
    if (result.success) {
      setSuccess(true);
      setForm({ first_name: "", last_name: "", email: "", social: "", company: "", job_title: "" });
      setSelectedSkills([]);
    } else {
      setError(result.error || "Something went wrong.");
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full border-b border-[var(--color-smoke)] bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  return (
    <div
      className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-black/70 py-12 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-2xl rounded-xl border border-white/10 bg-[var(--color-dark)] p-10 shadow-2xl sm:p-12"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-5xl">
          JOIN THE DATABASE
        </h2>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
          Add yourself to the Creator Space directory.
        </p>

        {success ? (
          <div className="mt-10 text-center">
            <p className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-lime)]">
              YOU&apos;RE IN.
            </p>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
              Welcome to the community.
            </p>
            <button
              onClick={onClose}
              className="mt-8 rounded-full bg-[var(--color-charcoal)] px-10 py-3.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all duration-300 hover:bg-[var(--color-ash)] hover:text-[var(--color-white)]"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <input
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                placeholder="First Name *"
                required
                className={inputClass}
              />
              <input
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                placeholder="Last Name *"
                required
                className={inputClass}
              />
            </div>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Email *"
              required
              className={inputClass}
            />
            <input
              name="social"
              value={form.social}
              onChange={handleChange}
              placeholder="Social (Instagram, X, etc.)"
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-6">
              <input
                name="company"
                value={form.company}
                onChange={handleChange}
                placeholder="Company"
                className={inputClass}
              />
              <input
                name="job_title"
                value={form.job_title}
                onChange={handleChange}
                placeholder="Job Title"
                className={inputClass}
              />
            </div>

            {/* Skills multi-select dropdown */}
            <div ref={dropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex w-full items-center justify-between border-b border-[var(--color-smoke)] px-2 py-3 text-left transition-colors focus:border-[var(--color-coral)]"
              >
                {selectedSkills.length === 0 ? (
                  <span className="font-[family-name:var(--font-mono)] text-base text-[var(--color-smoke)]">
                    Skills / Profession * (pick up to 3)
                  </span>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map((skill) => (
                      <span
                        key={skill}
                        className="flex items-center gap-1.5 rounded-full bg-[var(--color-coral)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)]"
                      >
                        {skill}
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeSkill(skill);
                          }}
                          className="cursor-pointer text-[var(--color-black)]/60 hover:text-[var(--color-black)]"
                        >
                          ×
                        </span>
                      </span>
                    ))}
                  </div>
                )}
                <span className="ml-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                  {dropdownOpen ? "▲" : "▼"}
                </span>
              </button>

              {dropdownOpen && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-56 overflow-y-auto rounded-lg border border-white/10 bg-[var(--color-charcoal)] py-1 shadow-xl">
                  {SKILL_OPTIONS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    const isDisabled = !isSelected && selectedSkills.length >= MAX_SKILLS;
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => !isDisabled && toggleSkill(skill)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left font-[family-name:var(--font-mono)] text-sm transition-colors ${
                          isDisabled
                            ? "cursor-not-allowed text-[var(--color-ash)]"
                            : isSelected
                              ? "bg-[var(--color-coral)]/10 text-[var(--color-coral)]"
                              : "text-[var(--color-mist)] hover:bg-[var(--color-ash)]"
                        }`}
                      >
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded border text-[10px] ${
                            isSelected
                              ? "border-[var(--color-coral)] bg-[var(--color-coral)] text-[var(--color-black)]"
                              : "border-[var(--color-smoke)]"
                          }`}
                        >
                          {isSelected && "✓"}
                        </span>
                        {skill}
                      </button>
                    );
                  })}
                  {selectedSkills.length >= MAX_SKILLS && (
                    <p className="px-4 py-2 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                      Maximum of {MAX_SKILLS} skills selected.
                    </p>
                  )}
                </div>
              )}
            </div>

            {error && (
              <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
                {error}
              </p>
            )}

            <TurnstileWidget
              onSuccess={setTurnstileToken}
              onExpire={() => setTurnstileToken("")}
            />

            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="mt-2 w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? "SUBMITTING..." : "JOIN"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
