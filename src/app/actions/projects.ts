"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";

async function getAuthCreatorId(): Promise<string | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();

  return data?.id || null;
}

export async function createProject(data: {
  title: string;
  description?: string;
  youtube_url?: string;
  link_url?: string;
  link_label?: string;
}) {
  const creatorId = await getAuthCreatorId();
  if (!creatorId) return { error: "Not authenticated." };

  // Get next sort order
  const { data: existing } = await getSupabaseAdmin()
    .from("projects")
    .select("sort_order")
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data: project, error } = await getSupabaseAdmin()
    .from("projects")
    .insert({
      creator_id: creatorId,
      title: data.title,
      description: data.description || null,
      youtube_url: data.youtube_url ? normalizeYoutubeUrl(data.youtube_url) : null,
      link_url: data.link_url || null,
      link_label: data.link_label || null,
      sort_order: nextOrder,
    })
    .select("id")
    .single();

  if (error) return { error: "Failed to create project." };

  revalidatePath("/profile/edit");
  revalidatePath("/directory");
  return { success: true, id: project.id };
}

export async function updateProject(
  projectId: string,
  data: {
    title: string;
    description?: string;
    youtube_url?: string;
    link_url?: string;
    link_label?: string;
  }
) {
  const creatorId = await getAuthCreatorId();
  if (!creatorId) return { error: "Not authenticated." };

  // Verify ownership
  const { data: project } = await getSupabaseAdmin()
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id !== creatorId) {
    return { error: "Not authorized." };
  }

  const { error } = await getSupabaseAdmin()
    .from("projects")
    .update({
      title: data.title,
      description: data.description || null,
      youtube_url: data.youtube_url ? normalizeYoutubeUrl(data.youtube_url) : null,
      link_url: data.link_url || null,
      link_label: data.link_label || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", projectId);

  if (error) return { error: "Failed to update project." };

  revalidatePath("/profile/edit");
  revalidatePath("/directory");
  return { success: true };
}

export async function deleteProject(projectId: string) {
  const creatorId = await getAuthCreatorId();
  if (!creatorId) return { error: "Not authenticated." };

  // Verify ownership
  const { data: project } = await getSupabaseAdmin()
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id !== creatorId) {
    return { error: "Not authorized." };
  }

  // Delete images first (cascade should handle it, but be explicit)
  await getSupabaseAdmin()
    .from("project_images")
    .delete()
    .eq("project_id", projectId);

  const { error } = await getSupabaseAdmin()
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) return { error: "Failed to delete project." };

  revalidatePath("/profile/edit");
  revalidatePath("/directory");
  return { success: true };
}

export async function getCreatorProjects(creatorId: string) {
  const { data: projects } = await getSupabaseAdmin()
    .from("projects")
    .select("*")
    .eq("creator_id", creatorId)
    .order("sort_order", { ascending: true });

  if (!projects || projects.length === 0) return [];

  // Fetch images for all projects
  const projectIds = projects.map((p) => p.id);
  const { data: images } = await getSupabaseAdmin()
    .from("project_images")
    .select("*")
    .in("project_id", projectIds)
    .order("sort_order", { ascending: true });

  return projects.map((p) => ({
    ...p,
    images: (images || []).filter((img) => img.project_id === p.id),
  }));
}

export async function addProjectImage(projectId: string, imageUrl: string) {
  const creatorId = await getAuthCreatorId();
  if (!creatorId) return { error: "Not authenticated." };

  // Verify ownership
  const { data: project } = await getSupabaseAdmin()
    .from("projects")
    .select("creator_id")
    .eq("id", projectId)
    .single();

  if (!project || project.creator_id !== creatorId) {
    return { error: "Not authorized." };
  }

  // Get next sort order
  const { data: existing } = await getSupabaseAdmin()
    .from("project_images")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { error } = await getSupabaseAdmin().from("project_images").insert({
    project_id: projectId,
    image_url: imageUrl,
    sort_order: nextOrder,
  });

  if (error) return { error: "Failed to add image." };

  revalidatePath("/profile/edit");
  revalidatePath("/directory");
  return { success: true };
}

export async function deleteProjectImage(imageId: string) {
  const creatorId = await getAuthCreatorId();
  if (!creatorId) return { error: "Not authenticated." };

  // Verify ownership through project -> creator chain
  const { data: image } = await getSupabaseAdmin()
    .from("project_images")
    .select("project_id")
    .eq("id", imageId)
    .single();

  if (!image) return { error: "Image not found." };

  const { data: project } = await getSupabaseAdmin()
    .from("projects")
    .select("creator_id")
    .eq("id", image.project_id)
    .single();

  if (!project || project.creator_id !== creatorId) {
    return { error: "Not authorized." };
  }

  const { error } = await getSupabaseAdmin()
    .from("project_images")
    .delete()
    .eq("id", imageId);

  if (error) return { error: "Failed to delete image." };

  revalidatePath("/profile/edit");
  revalidatePath("/directory");
  return { success: true };
}

// Extract YouTube embed ID from various URL formats
function normalizeYoutubeUrl(url: string): string {
  const cleaned = url.trim();

  // Already an embed ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(cleaned)) {
    return cleaned;
  }

  try {
    const parsed = new URL(cleaned);

    // youtu.be/VIDEO_ID
    if (parsed.hostname === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0];
    }

    // youtube.com/watch?v=VIDEO_ID
    if (parsed.hostname.includes("youtube.com")) {
      const v = parsed.searchParams.get("v");
      if (v) return v;

      // youtube.com/embed/VIDEO_ID
      const embedMatch = parsed.pathname.match(/\/embed\/([a-zA-Z0-9_-]+)/);
      if (embedMatch) return embedMatch[1];

      // youtube.com/shorts/VIDEO_ID
      const shortsMatch = parsed.pathname.match(/\/shorts\/([a-zA-Z0-9_-]+)/);
      if (shortsMatch) return shortsMatch[1];
    }
  } catch {
    // Not a valid URL
  }

  return cleaned;
}

