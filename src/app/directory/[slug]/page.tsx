import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import type { Metadata } from "next";

interface Creator {
  id: string;
  first_name: string;
  last_name: string;
  company: string | null;
  job_title: string | null;
  skills: string;
  bio: string | null;
  website: string | null;
  social: string | null;
  avatar_url: string | null;
  slug: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const { data } = await supabaseAdmin
    .from("creators")
    .select("first_name, last_name, bio")
    .eq("slug", slug)
    .single();

  if (!data) {
    return { title: "Creator Not Found" };
  }

  return {
    title: `${data.first_name} ${data.last_name} — Creator Space Fort Wayne`,
    description:
      data.bio ||
      `${data.first_name} ${data.last_name} is a creator in the Fort Wayne community.`,
  };
}

export default async function CreatorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const { data: creator } = await supabaseAdmin
    .from("creators")
    .select(
      "id, first_name, last_name, company, job_title, skills, bio, website, social, avatar_url, slug"
    )
    .eq("slug", slug)
    .single();

  if (!creator) {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  const showAdminEdit = !!user && isAdmin(user.email);

  const c = creator as Creator;
  const initials = `${c.first_name[0]}${c.last_name[0]}`.toUpperCase();
  const skillTags = c.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      <div className="relative z-10 mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <Link
            href="/directory"
            className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
          >
            ← Back to Directory
          </Link>
          {showAdminEdit && (
            <Link
              href={`/profile/edit/${c.id}`}
              className="rounded-full border border-white/10 px-5 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-all hover:border-[var(--color-coral)] hover:text-[var(--color-coral)]"
            >
              Edit
            </Link>
          )}
        </div>

        <div className="mt-10 flex flex-col items-center text-center">
          {/* Avatar */}
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[var(--color-charcoal)]">
            {c.avatar_url ? (
              <img
                src={c.avatar_url}
                alt={`${c.first_name} ${c.last_name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-mist)]">
                {initials}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-5xl">
            {c.first_name} {c.last_name}
          </h1>

          {/* Company / Job Title */}
          {(c.company || c.job_title) && (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              {c.job_title}
              {c.job_title && c.company ? " · " : ""}
              {c.company}
            </p>
          )}

          {/* Skills */}
          {skillTags.length > 0 && (
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {skillTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-charcoal)] px-3 py-1 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {c.bio && (
            <p className="mt-6 max-w-lg font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
              {c.bio}
            </p>
          )}

          {/* Links */}
          <div className="mt-6 flex gap-4">
            {c.website && (
              <a
                href={
                  c.website.startsWith("http")
                    ? c.website
                    : `https://${c.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] hover:underline"
              >
                Website
              </a>
            )}
            {c.social && (
              <span className="font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)]">
                {c.social}
              </span>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
