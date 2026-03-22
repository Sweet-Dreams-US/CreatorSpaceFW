"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import { updateAvatarUrl } from "@/app/actions/profile";

interface AvatarUploadProps {
  userId: string;
  currentUrl: string | null;
  initials: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AvatarUpload({
  userId,
  currentUrl,
  initials,
}: AvatarUploadProps) {
  const [avatarUrl, setAvatarUrl] = useState(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setFileSize(null);

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Invalid format. Use JPEG, PNG, WebP, or GIF.");
      e.target.value = "";
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${formatFileSize(file.size)}). Max 5 MB.`);
      e.target.value = "";
      return;
    }

    setFileSize(formatFileSize(file.size));
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
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleUpload}
        className="hidden"
      />
      {error && (
        <p className="font-[family-name:var(--font-mono)] text-xs text-red-400">
          {error}
        </p>
      )}
      <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Click to upload
      </span>
      {fileSize && !error && (
        <span className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]">
          {fileSize}
        </span>
      )}
    </div>
  );
}
