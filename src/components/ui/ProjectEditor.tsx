"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase";
import {
  createProject,
  updateProject,
  deleteProject,
  addProjectImage,
  deleteProjectImage,
} from "@/app/actions/projects";

export interface ProjectImage {
  id: string;
  image_url: string;
  sort_order: number;
}

export interface Project {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  link_url: string | null;
  link_label: string | null;
  sort_order: number;
  images: ProjectImage[];
}

interface ProjectEditorProps {
  userId: string;
  projects: Project[];
  onUpdate: () => void;
}

export default function ProjectEditor({
  userId,
  projects,
  onUpdate,
}: ProjectEditorProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
          PROJECTS
        </h2>
        <button
          type="button"
          onClick={() => {
            setEditingProject(null);
            setShowForm(true);
          }}
          className="rounded-full bg-[var(--color-coral)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:scale-105"
        >
          + Add Project
        </button>
      </div>

      <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
        Showcase your work with images and YouTube embeds.
      </p>

      {/* Project List */}
      {projects.length === 0 && !showForm ? (
        <div className="mt-6 rounded-lg border border-dashed border-[var(--color-ash)] py-12 text-center">
          <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
            No projects yet. Add your first project to showcase your work.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              userId={userId}
              onEdit={() => {
                setEditingProject(project);
                setShowForm(true);
              }}
              onDelete={async () => {
                if (!confirm("Delete this project?")) return;
                await deleteProject(project.id);
                onUpdate();
              }}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      )}

      {/* Project Form Modal */}
      {showForm && (
        <ProjectFormModal
          project={editingProject}
          userId={userId}
          onClose={() => {
            setShowForm(false);
            setEditingProject(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingProject(null);
            onUpdate();
          }}
        />
      )}
    </div>
  );
}

function ProjectCard({
  project,
  userId,
  onEdit,
  onDelete,
  onUpdate,
}: {
  project: Project;
  userId: string;
  onEdit: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [uploadError, setUploadError] = useState("");

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setUploadError("File must be an image");
      return;
    }

    setUploading(true);
    setUploadError("");

    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/projects/${project.id}/${Date.now()}.${ext}`;
      const supabase = createClient();

      const uploadPromise = supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      const timeoutPromise = new Promise<{ error: { message: string } }>((_, reject) =>
        setTimeout(() => reject(new Error("Upload timed out. Try a smaller image.")), 15000)
      );

      const { error: storageError } = await Promise.race([uploadPromise, timeoutPromise]);

      if (storageError) {
        setUploadError(storageError.message);
        setUploading(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);
      await addProjectImage(project.id, `${publicUrl}?t=${Date.now()}`);
      onUpdate();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }

    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Remove this image?")) return;
    await deleteProjectImage(imageId);
    onUpdate();
  };

  return (
    <div className="rounded-xl border border-[var(--color-ash)] bg-[var(--color-dark)] p-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-[family-name:var(--font-display)] text-lg text-[var(--color-white)]">
            {project.title}
          </h3>
          {project.description && (
            <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] line-clamp-2">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-sky)] hover:underline"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="font-[family-name:var(--font-mono)] text-xs text-red-400 hover:underline"
          >
            Delete
          </button>
        </div>
      </div>

      {/* YouTube Embed */}
      {project.youtube_url && (
        <div className="mt-4 overflow-hidden rounded-lg">
          <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
            <iframe
              src={`https://www.youtube.com/embed/${project.youtube_url}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      )}

      {/* Images */}
      {project.images.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {project.images.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-lg">
              <img
                src={img.image_url}
                alt=""
                className="aspect-square w-full object-cover"
              />
              <button
                type="button"
                onClick={() => handleDeleteImage(img.id)}
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 font-[family-name:var(--font-mono)] text-xs text-red-400 opacity-0 transition-opacity group-hover:opacity-100"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Link */}
      {project.link_url && (
        <div className="mt-3">
          <a
            href={project.link_url.startsWith("http") ? project.link_url : `https://${project.link_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] hover:underline"
          >
            {project.link_label || project.link_url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")} →
          </a>
        </div>
      )}

      {/* Add Image Button */}
      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="rounded-full border border-dashed border-[var(--color-ash)] px-3 py-1.5 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)] disabled:opacity-50"
        >
          {uploading ? "Uploading..." : "+ Add Image"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
      </div>
      {uploadError && (
        <p className="mt-2 font-[family-name:var(--font-mono)] text-xs text-red-400">
          {uploadError}
        </p>
      )}
    </div>
  );
}

function ProjectFormModal({
  project,
  userId,
  onClose,
  onSaved,
}: {
  project: Project | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState({
    title: project?.title || "",
    description: project?.description || "",
    youtube_url: project?.youtube_url || "",
    link_url: project?.link_url || "",
    link_label: project?.link_label || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const inputClass =
    "w-full border-b border-[var(--color-ash)] bg-transparent px-2 py-2.5 font-[family-name:var(--font-mono)] text-sm text-[var(--color-white)] outline-none placeholder:text-[var(--color-smoke)] focus:border-[var(--color-coral)] transition-colors";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data.title.trim()) {
      setError("Title is required.");
      return;
    }

    setSaving(true);
    const result = project
      ? await updateProject(project.id, data)
      : await createProject(data);

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
          {project ? "EDIT PROJECT" : "NEW PROJECT"}
        </h2>
        <p className="mt-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
          Add details about your work. You can add images after saving.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            placeholder="Project Title *"
            value={data.title}
            onChange={(e) => setData({ ...data, title: e.target.value })}
            className={inputClass}
          />

          <textarea
            placeholder="Description — what was the project about?"
            value={data.description}
            onChange={(e) => setData({ ...data, description: e.target.value })}
            rows={3}
            className={`${inputClass} resize-none`}
          />

          <div>
            <input
              placeholder="YouTube URL (paste any YouTube link)"
              value={data.youtube_url}
              onChange={(e) => setData({ ...data, youtube_url: e.target.value })}
              className={inputClass}
            />
            <p className="mt-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
              Supports youtube.com, youtu.be, and shorts links
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input
              placeholder="Project Link URL"
              value={data.link_url}
              onChange={(e) => setData({ ...data, link_url: e.target.value })}
              className={inputClass}
            />
            <input
              placeholder="Link Label (e.g. View Site)"
              value={data.link_label}
              onChange={(e) => setData({ ...data, link_label: e.target.value })}
              className={inputClass}
            />
          </div>

          {error && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-sm font-semibold text-[var(--color-black)] transition-all hover:scale-105 disabled:opacity-50"
            >
              {saving ? "Saving..." : project ? "Update Project" : "Create Project"}
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
