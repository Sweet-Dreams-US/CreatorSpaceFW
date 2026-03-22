import { notFound } from "next/navigation";
import Link from "next/link";
import { createServerSupabaseClient, supabaseAdmin } from "@/lib/supabase-server";
import { isAdmin } from "@/lib/admin";
import { parseSocialField, getPlatformIcon, getPlatformColor } from "@/lib/social-parser";
import { getCreatorProjects } from "@/app/actions/projects";
import { logProfileView } from "@/app/actions/tracking";
import BadgeDisplay from "@/components/ui/BadgeDisplay";
import ConnectButton from "@/components/ui/ConnectButton";
import ShareProfile from "@/components/ui/ShareProfile";
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
  badges: string[] | null;
  location: string | null;
}

interface ProjectImage {
  id: string;
  image_url: string;
  sort_order: number;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string | null;
  link_url: string | null;
  link_label: string | null;
  images: ProjectImage[];
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
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
  const supabase = await createServerSupabaseClient();
  const { data: creator } = await supabase
    .from("creators")
    .select(
      "id, first_name, last_name, company, job_title, skills, bio, website, social, avatar_url, slug, badges, location"
    )
    .eq("slug", slug)
    .single();

  if (!creator) {
    notFound();
  }

  // Track profile view (fire-and-forget, don't block render)
  logProfileView(creator.id).catch(() => {});

  const { data: { user } } = await supabase.auth.getUser();
  const showAdminEdit = !!user && isAdmin(user.email);

  // Get current user's creator ID for the connect button
  let currentCreatorId: string | null = null;
  if (user) {
    const { data: currentCreator } = await supabase
      .from("creators")
      .select("id")
      .eq("auth_id", user.id)
      .single();
    currentCreatorId = currentCreator?.id || null;
  }

  const c = creator as Creator;
  const initials = `${c.first_name?.[0] || ""}${c.last_name?.[0] || ""}`.toUpperCase();
  const skillTags = c.skills
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const socialLinks = parseSocialField(c.social);
  const projects = (await getCreatorProjects(c.id)) as Project[];

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Subtle gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 50% 30% at 50% 30%, #fa927720, transparent)",
        }}
      />

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
          <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-2 border-white/10 bg-[var(--color-charcoal)] shadow-[0_0_40px_rgba(250,146,119,0.1)]">
            {c.avatar_url ? (
              <img
                src={c.avatar_url}
                alt={`${c.first_name} ${c.last_name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-mist)]">
                {initials}
              </span>
            )}
          </div>

          {/* Name */}
          <h1 className="mt-6 font-[family-name:var(--font-display)] text-4xl text-[var(--color-white)] sm:text-5xl">
            {c.first_name} {c.last_name}
          </h1>

          {/* Share & Connect */}
          <div className="mt-4 flex items-center gap-3">
            <ConnectButton
              targetCreatorId={c.id}
              currentUserId={user?.id || null}
              currentCreatorId={currentCreatorId}
            />
            <ShareProfile
              creatorName={`${c.first_name} ${c.last_name}`}
              slug={c.slug}
            />
          </div>

          {/* Company / Job Title */}
          {(c.company || c.job_title) && (
            <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
              {c.job_title}
              {c.job_title && c.company ? " · " : ""}
              {c.company}
            </p>
          )}

          {/* Badges */}
          {c.badges && c.badges.length > 0 && (
            <div className="mt-4">
              <BadgeDisplay badges={c.badges} />
            </div>
          )}

          {/* Divider */}
          <div className="mt-6 h-px w-16 bg-[var(--color-ash)]" />

          {/* Skills */}
          {skillTags.length > 0 && (
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              {skillTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-1.5 font-[family-name:var(--font-mono)] text-xs text-[var(--color-mist)] transition-colors hover:border-[var(--color-coral)]/30 hover:text-[var(--color-coral)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Bio */}
          {c.bio && (
            <div className="mt-8 max-w-lg">
              <p className="font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
                {c.bio}
              </p>
            </div>
          )}

          {/* Links Section */}
          {(c.website || socialLinks.length > 0) && (
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              {c.website && (
                <a
                  href={
                    c.website.startsWith("http")
                      ? c.website
                      : `https://${c.website}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-lime)] transition-all hover:border-[var(--color-lime)]/40 hover:shadow-[0_0_12px_rgba(157,250,119,0.1)]"
                >
                  <span className="text-[10px] opacity-60">WEB</span>
                  {c.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                </a>
              )}
              {socialLinks.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 rounded-full border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs transition-all hover:border-opacity-40"
                  style={{
                    color: getPlatformColor(link.platform),
                  }}
                >
                  <span className="text-[10px] opacity-60">
                    {getPlatformIcon(link.platform)}
                  </span>
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Projects Section */}
        {projects.length > 0 && (
          <div className="mt-16">
            <h2 className="text-center font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
              PROJECTS
            </h2>
            <div className="mt-6 h-px w-full bg-[var(--color-ash)]" />

            <div className="mt-8 space-y-10">
              {projects.map((project) => (
                <div key={project.id}>
                  {/* Project Title */}
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-white)]">
                    {project.title}
                  </h3>

                  {/* Description */}
                  {project.description && (
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-sm leading-relaxed text-[var(--color-mist)]">
                      {project.description}
                    </p>
                  )}

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

                  {/* Images Grid */}
                  {project.images.length > 0 && (
                    <div
                      className={`mt-4 grid gap-2 ${
                        project.images.length === 1
                          ? "grid-cols-1"
                          : project.images.length === 2
                          ? "grid-cols-2"
                          : "grid-cols-2 sm:grid-cols-3"
                      }`}
                    >
                      {project.images.map((img) => (
                        <div
                          key={img.id}
                          className="overflow-hidden rounded-lg"
                        >
                          <img
                            src={img.image_url}
                            alt=""
                            className={`w-full object-cover ${
                              project.images.length === 1
                                ? "max-h-[500px]"
                                : "aspect-square"
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Project Link */}
                  {project.link_url && (
                    <div className="mt-4">
                      <a
                        href={
                          project.link_url.startsWith("http")
                            ? project.link_url
                            : `https://${project.link_url}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--color-ash)] bg-[var(--color-dark)] px-4 py-2 font-[family-name:var(--font-mono)] text-xs text-[var(--color-coral)] transition-all hover:border-[var(--color-coral)]/40 hover:shadow-[0_0_12px_rgba(250,146,119,0.1)]"
                      >
                        {project.link_label ||
                          project.link_url
                            .replace(/^https?:\/\/(www\.)?/, "")
                            .replace(/\/$/, "")}{" "}
                        →
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
