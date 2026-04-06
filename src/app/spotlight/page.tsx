import Link from "next/link";
import { getCurrentSpotlight, getPastSpotlights } from "@/app/actions/points";

export const dynamic = "force-dynamic";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function SpotlightPage() {
  const current = await getCurrentSpotlight();
  const pastRaw = await getPastSpotlights();

  // Filter out current month from past spotlights
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const past = pastRaw.filter(
    (s: { month: number; year: number }) =>
      !(s.month === currentMonth && s.year === currentYear)
  );

  return (
    <main className="min-h-screen bg-[var(--color-black)] px-6 py-16">
      {/* Background gradient */}
      <div
        className="pointer-events-none fixed inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 20%, #fa927730, transparent)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl">
        {/* Back link */}
        <Link
          href="/"
          className="inline-block font-[family-name:var(--font-mono)] text-xs text-[var(--color-smoke)] transition-colors hover:text-[var(--color-coral)]"
        >
          &larr; Back to Home
        </Link>

        {/* Header */}
        <h1 className="mt-6 font-[family-name:var(--font-display)] text-5xl text-[var(--color-white)] sm:text-7xl">
          CREATOR SPOTLIGHT
        </h1>
        <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
          Celebrating the creators who make Fort Wayne shine
        </p>

        {/* Current Spotlight */}
        <section className="mt-12">
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-[var(--color-coral)]/40 to-transparent" />
            <span className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-widest text-[var(--color-coral)]">
              {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[var(--color-coral)]/40 to-transparent" />
          </div>

          {current?.creators ? (
            <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--color-coral)]/20 bg-[var(--color-dark)] shadow-[0_0_60px_rgba(250,146,119,0.08)]">
              <div className="flex flex-col md:flex-row">
                {/* Avatar side */}
                <div className="flex items-center justify-center bg-gradient-to-br from-[var(--color-coral)]/10 to-transparent p-10 md:w-1/3">
                  <div className="relative">
                    <div className="absolute -inset-3 rounded-full bg-[var(--color-coral)]/10 blur-xl" />
                    <div className="relative flex h-36 w-36 items-center justify-center overflow-hidden rounded-full border-2 border-[var(--color-coral)]/30 bg-[var(--color-charcoal)]">
                      {current.creators.avatar_url ? (
                        <img
                          src={current.creators.avatar_url}
                          alt={`${current.creators.first_name} ${current.creators.last_name}`}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-[family-name:var(--font-display)] text-4xl text-[var(--color-mist)]">
                          {(current.creators.first_name?.[0] || "") +
                            (current.creators.last_name?.[0] || "")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info side */}
                <div className="flex-1 p-8 md:p-10">
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-[var(--color-coral)]">
                    Creator of the Month
                  </p>
                  <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl text-[var(--color-white)] sm:text-4xl">
                    {current.creators.first_name} {current.creators.last_name}
                  </h2>

                  {(current.creators.job_title || current.creators.company) && (
                    <p className="mt-2 font-[family-name:var(--font-mono)] text-sm text-[var(--color-mist)]">
                      {current.creators.job_title}
                      {current.creators.job_title && current.creators.company && " at "}
                      {current.creators.company && (
                        <span className="text-[var(--color-sky)]">{current.creators.company}</span>
                      )}
                    </p>
                  )}

                  {current.creators.bio && (
                    <p className="mt-4 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)] leading-relaxed">
                      {current.creators.bio}
                    </p>
                  )}

                  {current.creators.skills && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {(typeof current.creators.skills === "string" ? current.creators.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : current.creators.skills as string[]).map((skill: string) => (
                        <span
                          key={skill}
                          className="rounded-full border border-[var(--color-ash)] px-3 py-1 font-[family-name:var(--font-mono)] text-[10px] text-[var(--color-mist)]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  {current.creators.slug && (
                    <Link
                      href={`/directory/${current.creators.slug}`}
                      className="mt-6 inline-block rounded-full bg-[var(--color-coral)] px-6 py-2.5 font-[family-name:var(--font-mono)] text-xs font-semibold text-[var(--color-black)] transition-all hover:shadow-[0_0_24px_rgba(250,146,119,0.4)]"
                    >
                      View Profile
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-white/5 bg-[var(--color-dark)] p-12 text-center">
              <p className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
                No spotlight selected this month
              </p>
              <p className="mt-3 font-[family-name:var(--font-mono)] text-sm text-[var(--color-smoke)]">
                Check back soon to see who gets featured next.
              </p>
            </div>
          )}
        </section>

        {/* Past Spotlights */}
        {past.length > 0 && (
          <section className="mt-16">
            <h3 className="font-[family-name:var(--font-display)] text-2xl text-[var(--color-white)]">
              Past Spotlights
            </h3>

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((spotlight: {
                id?: string;
                month: number;
                year: number;
                creators: {
                  id: string;
                  first_name: string;
                  last_name: string;
                  avatar_url: string | null;
                  slug: string | null;
                };
              }) => (
                <div
                  key={`${spotlight.month}-${spotlight.year}`}
                  className="group rounded-xl border border-white/5 bg-[var(--color-dark)] p-5 transition-all duration-300 hover:border-[var(--color-coral)]/30"
                >
                  <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-[var(--color-smoke)]">
                    {MONTH_NAMES[spotlight.month - 1]} {spotlight.year}
                  </p>

                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-charcoal)]">
                      {spotlight.creators?.avatar_url ? (
                        <img
                          src={spotlight.creators.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="font-[family-name:var(--font-display)] text-sm text-[var(--color-mist)]">
                          {(spotlight.creators?.first_name?.[0] || "") +
                            (spotlight.creators?.last_name?.[0] || "")}
                        </span>
                      )}
                    </div>
                    <div>
                      {spotlight.creators?.slug ? (
                        <Link
                          href={`/directory/${spotlight.creators.slug}`}
                          className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)] transition-colors group-hover:text-[var(--color-coral)]"
                        >
                          {spotlight.creators?.first_name}{" "}
                          {spotlight.creators?.last_name}
                        </Link>
                      ) : (
                        <p className="font-[family-name:var(--font-display)] text-base text-[var(--color-white)]">
                          {spotlight.creators?.first_name}{" "}
                          {spotlight.creators?.last_name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
