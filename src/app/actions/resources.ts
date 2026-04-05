"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabaseClient, getSupabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { awardPoints } from "./points";

interface ResourceData {
  title: string;
  description?: string;
  category: string;
  terms: string;
  price?: string;
  image_url?: string;
}

export async function createResource(data: ResourceData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return { error: "Creator profile not found" };

  const { error } = await getSupabaseAdmin().from("resources").insert({
    creator_id: creator.id,
    title: data.title,
    description: data.description || null,
    category: data.category,
    terms: data.terms,
    price: data.price || null,
    image_url: data.image_url || null,
  });

  if (error) return { error: error.message };
  await awardPoints(creator.id, "resource_listed");
  revalidatePath("/resources");
  return { success: true };
}

export async function getResources(filters?: {
  category?: string;
  availability?: string;
  terms?: string;
}) {
  let query = getSupabaseAdmin()
    .from("resources")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .order("created_at", { ascending: false });

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.availability) query = query.eq("availability", filters.availability);
  else query = query.eq("availability", "available");
  if (filters?.terms) query = query.eq("terms", filters.terms);

  const { data } = await query;
  return data || [];
}

export async function getResource(resourceId: string) {
  const { data: resource } = await getSupabaseAdmin()
    .from("resources")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("id", resourceId)
    .single();

  if (!resource) return null;

  const { data: requests } = await getSupabaseAdmin()
    .from("resource_requests")
    .select("*, creators:creator_id(id, first_name, last_name, avatar_url, slug)")
    .eq("resource_id", resourceId)
    .order("created_at", { ascending: false });

  return { ...resource, requests: requests || [] };
}

export async function requestResource(
  resourceId: string,
  data: { message?: string; date_needed?: string; date_return?: string }
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: creator } = await getSupabaseAdmin()
    .from("creators")
    .select("id")
    .eq("auth_id", user.id)
    .single();
  if (!creator) return { error: "Creator profile not found" };

  const { error } = await getSupabaseAdmin().from("resource_requests").insert({
    resource_id: resourceId,
    creator_id: creator.id,
    message: data.message || null,
    date_needed: data.date_needed || null,
    date_return: data.date_return || null,
  });

  if (error) return { error: error.message };
  revalidatePath(`/resources/${resourceId}`);
  return { success: true };
}

export async function handleResourceRequest(
  requestId: string,
  status: "approved" | "declined"
) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await getSupabaseAdmin()
    .from("resource_requests")
    .update({ status })
    .eq("id", requestId);

  if (error) return { error: error.message };

  // If approved, mark resource as reserved
  if (status === "approved") {
    const { data: req } = await getSupabaseAdmin()
      .from("resource_requests")
      .select("resource_id")
      .eq("id", requestId)
      .single();
    if (req) {
      await getSupabaseAdmin()
        .from("resources")
        .update({ availability: "reserved", updated_at: new Date().toISOString() })
        .eq("id", req.resource_id);
    }
  }

  revalidatePath("/resources");
  return { success: true };
}

export async function updateResource(resourceId: string, data: Partial<ResourceData> & { availability?: string }) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { error } = await getSupabaseAdmin()
    .from("resources")
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq("id", resourceId);

  if (error) return { error: error.message };
  revalidatePath("/resources");
  return { success: true };
}

export async function deleteResource(resourceId: string) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const admin = isAdmin(user.email);
  if (!admin) {
    const { data: creator } = await getSupabaseAdmin()
      .from("creators")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    const { data: resource } = await getSupabaseAdmin()
      .from("resources")
      .select("creator_id")
      .eq("id", resourceId)
      .single();
    if (!resource || resource.creator_id !== creator?.id) return { error: "Not authorized" };
  }

  await getSupabaseAdmin().from("resources").delete().eq("id", resourceId);
  revalidatePath("/resources");
  return { success: true };
}
