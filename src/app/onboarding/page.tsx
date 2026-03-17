"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { updateProfile, updateAvatarUrl } from "@/app/actions/profile";
import { useAuth } from "@/components/providers/AuthProvider";

const SKILL_OPTIONS = [
  "Video", "Photo", "Editor", "VFX", "Code", "Music",
  "Aerial", "Design", "Writing", "Audio Engineering",
  "Animation", "Marketing", "Business", "Dance",
  "Film", "Podcasting", "Art", "Photography",
];

export default function OnboardingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    company: "",
    job_title: "",
    skills: [] as string[],
    bio: "",
    website: "",
    social: "",
  });

  // Load existing profile data
  useEffect(() => {
    if (!user) return;
    async function loadProfile() {
      const supabase = createClient();
      const { data } = await supabase
        .from("creators")
        .select("*")
        .eq("auth_id", user!.id)
        .single();
      if (data) {
        setForm({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          company: data.company || "",
          job_title: data.job_title || "",
          skills: data.skills ? data.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [],
          bio: data.bio || "",
          website: data.website || "",
          social: data.social || "",
        });
        setAvatarUrl(data.avatar_url);
      }
    }
    loadProfile();
  }, [user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)]">
        <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">Loading...</p>
      </main>
    );
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${user.id}/profile.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicUrl}?t=${Date.now()}`;
      await updateAvatarUrl(url);
      setAvatarUrl(url);
    }
    setUploading(false);
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => {
      if (prev.skills.includes(skill)) {
        return { ...prev, skills: prev.skills.filter((s) => s !== skill) };
      }
      if (prev.skills.length >= 5) return prev;
      return { ...prev, skills: [...prev.skills, skill] };
    });
  };

  const handleFinish = async () => {
    setSaving(true);
    const formData = new FormData();
    formData.set("first_name", form.first_name);
    formData.set("last_name", form.last_name);
    formData.set("company", form.company);
    formData.set("job_title", form.job_title);
    formData.set("skills", form.skills.join(", "));
    formData.set("bio", form.bio);
    formData.set("website", form.website);
    formData.set("social", form.social);

    await updateProfile(formData);
    setSaving(false);
    setStep(5);
  };

  const initials = `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase();

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-3 font-[family-name:var(--font-mono)] text-base text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  const totalSteps = 4;
  const progressPercent = step >= 5 ? 100 : ((step - 1) / totalSteps) * 100;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--color-black)] px-6">
      <div className="w-full max-w-md">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {step >= 5 ? "COMPLETE" : `STEP ${step} OF ${totalSteps}`}
            </p>
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)]">
              {Math.round(progressPercent)}%
            </p>
          </div>
          <div className="mt-2 h-0.5 w-full rounded-full bg-[var(--color-ash)]">
            <div
              className="h-full rounded-full bg-[var(--color-coral)] transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step 1: Avatar + Basic Info */}
        {step === 1 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
              WELCOME TO<br />CREATOR SPACE
            </h1>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Let&apos;s set up your profile. First, add a photo and verify your info.
            </p>

            {/* Avatar */}
            <div className="mt-8 flex justify-center">
              <label className="relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-ash)] bg-[var(--color-charcoal)] transition-colors hover:border-[var(--color-coral)]">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-mist)]">
                    {initials || "?"}
                  </span>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                    <span className="font-[family-name:var(--font-mono)] text-xs text-white">Uploading...</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <p className="mt-2 text-center font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              Click to upload photo
            </p>

            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <input
                  placeholder="First Name"
                  value={form.first_name}
                  onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  className={inputClass}
                />
                <input
                  placeholder="Last Name"
                  value={form.last_name}
                  onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  className={inputClass}
                />
              </div>
              <input
                placeholder="Company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Job Title"
                value={form.job_title}
                onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                className={inputClass}
              />
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!form.first_name.trim()}
              className="mt-8 w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
            >
              NEXT
            </button>
          </div>
        )}

        {/* Step 2: Skills */}
        {step === 2 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
              WHAT DO YOU DO?
            </h1>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Select up to 5 skills that describe your work.
            </p>

            <div className="mt-8 flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => {
                const active = form.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    onClick={() => toggleSkill(skill)}
                    className={`rounded-full px-4 py-2 font-[family-name:var(--font-mono)] text-xs transition-all ${
                      active
                        ? "bg-[var(--color-coral)] text-[var(--color-black)]"
                        : "border border-[var(--color-ash)] text-[var(--color-mist)] hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
                    }`}
                  >
                    {skill}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
              {form.skills.length}/5 selected
            </p>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="rounded-full border border-[var(--color-ash)] px-6 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105"
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Bio */}
        {step === 3 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
              TELL YOUR STORY
            </h1>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Add a short bio and your links.
            </p>

            <div className="mt-8 space-y-4">
              <textarea
                placeholder="Write a short bio about yourself..."
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={4}
                className={`${inputClass} resize-none`}
              />
              <input
                placeholder="Website (e.g. yoursite.com)"
                value={form.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className={inputClass}
              />
              <input
                placeholder="Social handles (e.g. @yourhandle)"
                value={form.social}
                onChange={(e) => setForm({ ...form, social: e.target.value })}
                className={inputClass}
              />
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="rounded-full border border-[var(--color-ash)] px-6 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105"
              >
                NEXT
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review & Save */}
        {step === 4 && (
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)]">
              LOOKS GOOD?
            </h1>
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Review your profile before going live.
            </p>

            {/* Preview card */}
            <div className="mt-8 rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-[family-name:var(--font-display)] text-xl text-[var(--color-mist)]">
                      {initials}
                    </span>
                  )}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                    {form.first_name} {form.last_name}
                  </p>
                  {(form.company || form.job_title) && (
                    <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                      {form.job_title}{form.job_title && form.company ? " · " : ""}{form.company}
                    </p>
                  )}
                </div>
              </div>

              {form.skills.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {form.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[var(--color-charcoal)] px-2.5 py-0.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              )}

              {form.bio && (
                <p className="mt-4 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] line-clamp-3">
                  {form.bio}
                </p>
              )}
            </div>

            <div className="mt-8 flex gap-3">
              <button
                onClick={() => setStep(3)}
                className="rounded-full border border-[var(--color-ash)] px-6 py-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
              >
                Back
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                className="flex-1 rounded-full bg-[var(--color-coral)] px-8 py-3 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
              >
                {saving ? "SAVING..." : "PUBLISH PROFILE"}
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Done! */}
        {step === 5 && (
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-lime)]/15">
              <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-lime)]">
                ✓
              </span>
            </div>
            <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)]">
              YOU&apos;RE LIVE
            </h1>
            <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              Your profile is now visible in the Creator Space directory.
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <button
                onClick={() => router.push("/directory")}
                className="w-full rounded-full bg-[var(--color-coral)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105"
              >
                VIEW DIRECTORY
              </button>
              <button
                onClick={() => router.push("/profile/edit")}
                className="w-full rounded-full border border-[var(--color-ash)] px-8 py-3.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] transition-all hover:border-[var(--color-smoke)]"
              >
                EDIT PROFILE
              </button>
              <button
                onClick={() => router.push("/")}
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] hover:text-[var(--color-coral)]"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
