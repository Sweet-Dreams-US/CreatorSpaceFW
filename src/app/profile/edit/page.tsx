"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase";
import { updateProfile } from "@/app/actions/profile";
import { logoutAction } from "@/app/actions/auth";
import { getCreatorProjects } from "@/app/actions/projects";
import AvatarUpload from "@/components/ui/AvatarUpload";
import ProjectEditor, { type Project } from "@/components/ui/ProjectEditor";
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
          "id, first_name, last_name, company, job_title, social, website, bio, skills, avatar_url, slug"
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

    const result = await updateProfile(formData);
    setSaving(false);

    if (result.error) {
      setMessage(result.error);
    } else {
      setMessage("Profile saved.");
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
          <AvatarUpload
            userId={user!.id}
            currentUrl={profile.avatar_url}
            initials={initials}
          />
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
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
          <input
            name="social"
            defaultValue={profile.social || ""}
            placeholder="Social (Instagram, X, etc.)"
            className={inputClass}
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
      </div>
    </main>
  );
}
