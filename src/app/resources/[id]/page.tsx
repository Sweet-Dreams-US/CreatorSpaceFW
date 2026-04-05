import { notFound } from "next/navigation";
import Link from "next/link";
import { getResource } from "@/app/actions/resources";
import {
  createServerSupabaseClient,
  getSupabaseAdmin,
} from "@/lib/supabase-server";
import ResourceDetailClient from "./ResourceDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

const CATEGORY_COLORS: Record<string, string> = {
  Equipment: "#fa9277",
  "Studio Space": "#d377fa",
  Software: "#77dffa",
  Transport: "#9dfa77",
  "Props & Wardrobe": "#f5c542",
  Other: "#ccc",
};

export default async function ResourceDetailPage({ params }: PageProps) {
  const { id } = await params;
  const resource = await getResource(id);

  if (!resource) return notFound();

  // Get current user's creator ID
  let currentCreatorId: string | null = null;

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: creator } = await getSupabaseAdmin()
        .from("creators")
        .select("id")
        .eq("auth_id", user.id)
        .single();

      if (creator) {
        currentCreatorId = creator.id;
      }
    }
  } catch {
    // Not logged in
  }

  const isOwner = currentCreatorId === resource.creator_id;

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #77dffa20, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-3xl">
        <Link
          href="/resources"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          &larr; Back to Resources
        </Link>

        {/* Resource header */}
        <div className="mt-6">
          {/* Badges */}
          <div className="flex items-center gap-3">
            <span
              className="rounded-full px-3 py-1 font-[family-name:var(--font-mono)] text-xs font-semibold"
              style={{
                backgroundColor:
                  CATEGORY_COLORS[resource.category] || "#ccc",
                color: "var(--color-black)",
              }}
            >
              {resource.category}
            </span>
            <span className="rounded-full border border-[var(--color-ash)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs capitalize text-[var(--color-mist)]">
              {resource.terms}
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor:
                    resource.availability === "available"
                      ? "#4ade80"
                      : resource.availability === "reserved"
                        ? "#facc15"
                        : "#6b7280",
                }}
              />
              <span className="font-[family-name:var(--font-mono)] text-xs capitalize text-[var(--color-smoke)]">
                {resource.availability}
              </span>
            </div>
          </div>

          <h1 className="mt-4 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-5xl">
            {resource.title}
          </h1>

          {/* Creator info */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
              {resource.creators?.avatar_url ? (
                <img
                  src={resource.creators.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="font-[family-name:var(--font-display)] text-sm text-[var(--color-mist)]">
                  {(resource.creators?.first_name?.[0] || "") +
                    (resource.creators?.last_name?.[0] || "")}
                </span>
              )}
            </div>
            <div>
              <Link
                href={
                  resource.creators?.slug
                    ? `/directory/${resource.creators.slug}`
                    : "#"
                }
                className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)] transition-colors hover:text-[var(--color-coral)]"
              >
                {resource.creators?.first_name} {resource.creators?.last_name}
              </Link>
              <p className="font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-smoke)]">
                Listed{" "}
                {new Date(resource.created_at).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Details card */}
        <div className="mt-8 rounded-xl border border-white/5 bg-[var(--color-dark)] p-6">
          {/* Image */}
          {resource.image_url && (
            <div className="mb-6 aspect-video overflow-hidden rounded-lg bg-[var(--color-charcoal)]">
              <img
                src={resource.image_url}
                alt={resource.title}
                className="h-full w-full object-cover"
              />
            </div>
          )}

          {resource.description && (
            <p className="font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)] leading-relaxed whitespace-pre-wrap">
              {resource.description}
            </p>
          )}

          {/* Terms + Price */}
          <div className="mt-6 flex flex-wrap gap-6 border-t border-white/5 pt-4">
            <div>
              <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                Terms
              </p>
              <p className="mt-1 font-[family-name:var(--font-mono)] text-sm capitalize text-[var(--color-sky)]">
                {resource.terms}
              </p>
            </div>
            {resource.terms === "rental" && resource.price && (
              <div>
                <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase text-[var(--color-smoke)]">
                  Price
                </p>
                <p className="mt-1 font-[family-name:var(--font-mono)] text-sm text-[var(--color-lime)]">
                  ${resource.price}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Interactive section */}
        <ResourceDetailClient
          resourceId={id}
          isOwner={isOwner}
          isLoggedIn={!!currentCreatorId}
          availability={resource.availability}
          requests={resource.requests || []}
        />
      </div>
    </main>
  );
}
