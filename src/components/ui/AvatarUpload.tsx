"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { updateAvatarUrl } from "@/app/actions/profile";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  initials: string;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  initials,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const ext = file.name.split(".").pop();
    const path = `${userId}/profile.${ext}`;
    const supabase = createClient();

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);

    // Append cache-buster
    const url = `${publicUrl}?t=${Date.now()}`;
    await updateAvatarUrl(url);
    setAvatarUrl(url);
    setUploading(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[var(--color-charcoal)] transition-colors hover:border-[var(--color-coral)]"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-mist)]">
            {initials}
          </span>
        )}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <span className="font-[family-name:var(--font-mono)] text-xs text-white">
              ...
            </span>
          </div>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        className="hidden"
      />
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Click to upload
      </span>
    </div>
  );
}
