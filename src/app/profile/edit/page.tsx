"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase";
import { updateProfile } from "@/app/actions/profile";
import { logoutAction, changePassword, deleteAccount } from "@/app/actions/auth";
import { getCreatorProjects } from "@/app/actions/projects";
import AvatarUpload from "@/components/ui/AvatarUpload";
import ProjectEditor, { type Project } from "@/components/ui/ProjectEditor";
import ProfileCompleteness from "@/components/ui/ProfileCompleteness";
import ToggleSwitch from "@/components/ui/ToggleSwitch";
import SocialFields from "@/components/ui/SocialFields";
import Link from "next/link";

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

interface EmailPrefs {
  events: boolean;
  announcements: boolean;
  connections: boolean;
}

const DEFAULT_EMAIL_PREFS: EmailPrefs = {
  events: true,
  announcements: true,
  connections: true,
};

interface CreatorProfile {
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  social: string | null;
  website: string | null;
  bio: string | null;
  skills: string;
  avatar_url: string | null;
  slug: string | null;
  location: string | null;
  email_prefs: EmailPrefs | null;
  can_teach: string[] | null;
  wants_to_learn: string[] | null;
}

export default function ProfileEditPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [creatorId, setCreatorId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>(DEFAULT_EMAIL_PREFS);
  const [canTeach, setCanTeach] = useState<string[]>([]);
  const [wantsToLearn, setWantsToLearn] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user) return;

    async function fetchProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from("creators")
        .select(
          "id, first_name, last_name, company, job_title, social, website, bio, skills, avatar_url, slug, location, email_prefs, can_teach, wants_to_learn"
        )
        .eq("auth_id", user!.id)
        .single();

      if (data) {
        setCreatorId(data.id);
        setProfile(data);
        if (data.skills) {
          setSelectedSkills(
            data.skills
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          );
        }
        if (data.can_teach) setCanTeach(data.can_teach);
        if (data.wants_to_learn) setWantsToLearn(data.wants_to_learn);
        if (data.email_prefs) {
          setEmailPrefs({ ...DEFAULT_EMAIL_PREFS, ...data.email_prefs });
        }
        // Load projects
        const projectData = await getCreatorProjects(data.id);
        setProjects(projectData as Project[]);
      }
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const onClick = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [dropdownOpen]);

  // Unsaved changes warning
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const loadProjects = useCallback(async () => {
    if (!creatorId) return;
    const projectData = await getCreatorProjects(creatorId);
    setProjects(projectData as Project[]);
  }, [creatorId]);

  function toggleSkill(skill: string) {
    setSelectedSkills((prev) => {
      if (prev.includes(skill)) return prev.filter((s) => s !== skill);
      if (prev.length >= MAX_SKILLS) return prev;
      return [...prev, skill];
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const formData = new FormData(e.currentTarget);
    formData.set("skills", selectedSkills.join(", "));
    formData.set("email_prefs", JSON.stringify(emailPrefs));
    formData.set("can_teach", JSON.stringify(canTeach));
    formData.set("wants_to_learn", JSON.stringify(wantsToLearn));

    const result = await updateProfile(formData);
    setSaving(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Profile saved.");
      setIsDirty(false);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)]">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Loading...
        </p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)]">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Profile not found.
        </p>
      </main>
    );
  }

  const inputClass =
    "w-full border-b border-[var(--color-smoke)] bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  const initials = `${profile.first_name?.[0] || ""}${profile.last_name?.[0] || ""}`.toUpperCase();

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      <div className="mx-auto max-w-2xl">
        <nav className="mb-6 flex gap-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          <Link
            href="/"
            className="transition-colors hover:text-[var(--color-coral)]"
          >
            ← Home
          </Link>
          <Link
            href="/directory"
            className="transition-colors hover:text-[var(--color-coral)]"
          >
            The Database
          </Link>
        </nav>

        <div className="flex items-center justify-between">
          <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
            EDIT PROFILE
          </h1>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-red-400 hover:text-red-400"
            >
              Log out
            </button>
          </form>
        </div>

        {profile.slug && (
          <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
            Public profile:{" "}
            <a
              href={`/directory/${profile.slug}`}
              className="text-[var(--color-coral)] hover:underline"
            >
              /directory/{profile.slug}
            </a>
          </p>
        )}

        <div className="mt-8">
          <ProfileCompleteness creator={profile} />
        </div>

        <div className="mt-8">
          <AvatarUpload
            userId={user!.id}
            currentUrl={profile.avatar_url}
            initials={initials}
          />
        </div>

        <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)} className="mt-8 space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <input
              name="first_name"
              defaultValue={profile.first_name}
              placeholder="First Name *"
              required
              className={inputClass}
            />
            <input
              name="last_name"
              defaultValue={profile.last_name}
              placeholder="Last Name *"
              required
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <input
              name="company"
              defaultValue={profile.company || ""}
              placeholder="Company"
              className={inputClass}
            />
            <input
              name="job_title"
              defaultValue={profile.job_title || ""}
              placeholder="Job Title"
              className={inputClass}
            />
          </div>
          <SocialFields
            defaultValue={profile.social}
            inputClass={inputClass}
          />
          <input
            name="website"
            defaultValue={profile.website || ""}
            placeholder="Website"
            className={inputClass}
          />
          <textarea
            name="bio"
            defaultValue={profile.bio || ""}
            placeholder="Bio — tell the community about yourself"
            rows={4}
            className={`${inputClass} resize-none border rounded-lg border-[var(--color-smoke)] p-3`}
          />

          {/* Skills multi-select */}
          <div ref={dropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex w-full items-center justify-between border-b border-[var(--color-smoke)] px-2 py-3 text-left transition-colors focus:border-[var(--color-coral)]"
            >
              {selectedSkills.length === 0 ? (
                <span className="font-[family-name:var(--font-mono)] text-base text-[var(--color-smoke)]">
                  Skills (pick up to 3)
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
                          toggleSkill(skill);
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
                  const isDisabled =
                    !isSelected && selectedSkills.length >= MAX_SKILLS;
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
              </div>
            )}
          </div>

          {/* Skills Exchange */}
          <div className="mt-4 border-t border-[var(--color-ash)] pt-6">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              SKILLS EXCHANGE
            </h3>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
              What can you teach others? What do you want to learn?
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)]">
                  I can teach
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const selected = canTeach.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setCanTeach((prev) =>
                            selected
                              ? prev.filter((s) => s !== skill)
                              : [...prev, skill]
                          )
                        }
                        className={`rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all ${
                          selected
                            ? "bg-[var(--color-lime)] text-[var(--color-black)] font-semibold"
                            : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-lime)] hover:text-[var(--color-lime)]"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <p className="mb-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)]">
                  I want to learn
                </p>
                <div className="flex flex-wrap gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const selected = wantsToLearn.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() =>
                          setWantsToLearn((prev) =>
                            selected
                              ? prev.filter((s) => s !== skill)
                              : [...prev, skill]
                          )
                        }
                        className={`rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] transition-all ${
                          selected
                            ? "bg-[var(--color-sky)] text-[var(--color-black)] font-semibold"
                            : "border border-[var(--color-ash)] text-[var(--color-smoke)] hover:border-[var(--color-sky)] hover:text-[var(--color-sky)]"
                        }`}
                      >
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Preferences */}
          <div className="mt-4 border-t border-[var(--color-ash)] pt-6">
            <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
              NOTIFICATION PREFERENCES
            </h3>
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
              Choose which emails you want to receive.
            </p>
            <div className="mt-4 space-y-1">
              <ToggleSwitch
                checked={emailPrefs.events}
                onChange={(val) =>
                  setEmailPrefs((prev) => ({ ...prev, events: val }))
                }
                label="Event announcements"
                description="Get notified about upcoming community events"
              />
              <ToggleSwitch
                checked={emailPrefs.announcements}
                onChange={(val) =>
                  setEmailPrefs((prev) => ({ ...prev, announcements: val }))
                }
                label="Community updates"
                description="News and updates from Creator Space"
              />
              <ToggleSwitch
                checked={emailPrefs.connections}
                onChange={(val) =>
                  setEmailPrefs((prev) => ({ ...prev, connections: val }))
                }
                label="Connection requests"
                description="When someone wants to connect with you"
              />
            </div>
          </div>

          {message && (
            <p
              className={`font-[family-name:var(--font-mono)] text-sm ${
                message.includes("saved")
                  ? "text-[var(--color-lime)]"
                  : "text-red-400"
              }`}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_24px_#fa927740] disabled:opacity-50 disabled:hover:scale-100"
          >
            {saving ? "SAVING..." : "SAVE PROFILE"}
          </button>
        </form>

        {/* Projects Section */}
        {creatorId && (
          <div className="mt-12 border-t border-[var(--color-ash)] pt-10">
            <ProjectEditor
              userId={user!.id}
              projects={projects}
              onUpdate={loadProjects}
            />
          </div>
        )}

        {/* Change Password */}
        <div className="mt-12 border-t border-[var(--color-ash)] pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
            CHANGE PASSWORD
          </h2>
          <div className="mt-4 max-w-md space-y-3">
            <input
              type="password"
              placeholder="New password (min 6 characters)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border-b border-[var(--color-ash)] bg-transparent px-0 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border-b border-[var(--color-ash)] bg-transparent px-0 py-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)]"
            />
            {passwordMessage && (
              <p className={`font-[family-name:var(--font-mono)] text-xs ${passwordMessage.includes("success") || passwordMessage.includes("updated") ? "text-[var(--color-lime)]" : "text-red-400"}`}>
                {passwordMessage}
              </p>
            )}
            <button
              onClick={async () => {
                if (newPassword.length < 6) {
                  setPasswordMessage("Password must be at least 6 characters");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  setPasswordMessage("Passwords don't match");
                  return;
                }
                setChangingPassword(true);
                const result = await changePassword(newPassword);
                setPasswordMessage(result.error || "Password updated successfully");
                if (!result.error) {
                  setNewPassword("");
                  setConfirmPassword("");
                }
                setChangingPassword(false);
              }}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="rounded-full border border-[var(--color-coral)] px-6 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:bg-[var(--color-coral)] hover:text-[var(--color-black)] disabled:opacity-50"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="mt-12 border-t border-red-400/20 pt-10">
          <h2 className="font-[family-name:var(--font-display)] text-xl text-red-400">
            DANGER ZONE
          </h2>
          <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
            Deleting your account will remove your login and unlink your profile. Your name and skills will remain in the directory as an unclaimed profile.
          </p>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="mt-4 rounded-full border border-red-400/50 px-6 py-2 font-[family-name:var(--font-mono)] text-xs text-red-400 transition-all hover:bg-red-400 hover:text-[var(--color-black)]"
            >
              Delete Account
            </button>
          ) : (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/5 p-4">
              <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">
                Are you sure? This cannot be undone.
              </p>
              <div className="mt-3 flex gap-3">
                <button
                  onClick={async () => {
                    setDeleting(true);
                    const result = await deleteAccount();
                    if (result.error) {
                      setPasswordMessage(result.error);
                      setDeleting(false);
                      setShowDeleteConfirm(false);
                    } else {
                      router.push("/");
                    }
                  }}
                  disabled={deleting}
                  className="rounded-full bg-red-400 px-6 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Yes, Delete My Account"}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="rounded-full border border-[var(--color-ash)] px-6 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
