# CreatorSpaceFW — Project Handoff Document

## What Is This

Creator Space Fort Wayne is a community platform for Fort Wayne, Indiana creators. It started as a directory of names and has been expanded into a full-featured community platform with collaboration tools, resource sharing, monthly challenges, skills exchange, business inquiry system, creator spotlight, event management with check-in, and a points/XP system.

**Live URL:** https://creatorspacefw.com
**Repo:** https://github.com/colemarcuccilli/CreatorSpaceFW (public)
**Admin emails:** cole@sweetdreamsmusic.com, cole@sweetdreams.us, zach@topspheremedia.com, zach@topsphere.com

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5.9 |
| Styling | Tailwind CSS 4 with CSS variables |
| Database | Supabase (PostgreSQL + Auth + Storage) |
| Auth | Supabase Auth with SSR (`@supabase/ssr@0.8.0`, `cookieEncoding: "raw"`) |
| Email | Resend (transactional) + Supabase SMTP (auth emails) |
| Animation | GSAP + ScrollTrigger |
| Hosting | Vercel (auto-deploy from `main`) |
| CAPTCHA | Cloudflare Turnstile |
| Domain | creatorspacefw.com (DNS via GoDaddy, CNAME to Vercel) |

**Supabase Project ID:** `eymjahxzesuoahpwzifq`
**Vercel Project:** `prj_FIC5T21A0ofC8mr0kOcUkc0WU09K`
**Vercel Team:** `team_4mlJIxMh7QofsXFfy1SA8fIG`

---

## Design System

**Colors (CSS variables):**
- `--color-coral`: #fa9277 (primary accent)
- `--color-lime`: #9dfa77 (success, "offering", teach)
- `--color-sky`: #77dffa (info, "learn")
- `--color-violet`: #d377fa (highlight)
- `--color-black`: #0a0a0a (background)
- `--color-dark`: #141414 (cards, panels)
- `--color-ash`: #2a2a2a (borders)
- `--color-smoke`: #888 (secondary text)
- `--color-mist`: #ccc (body text)
- `--color-white`: #fafafa (headings)

**Fonts:**
- `--font-display`: Changa One (headlines)
- `--font-mono`: IBM Plex Mono (body, labels, UI)

**Button patterns:** `rounded-full`, border-based soft buttons, solid coral CTAs
**Cards:** `rounded-xl border border-white/5 bg-[var(--color-dark)]`
**Inputs:** underline-style with `focus:border-[var(--color-coral)]`

---

## Vercel Environment Variables

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role (server-side only) |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `NEXT_PUBLIC_SITE_URL` | https://creatorspacefw.com |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Cloudflare Turnstile site key |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile server secret |

---

## Database Tables

| Table | Purpose |
|-------|---------|
| `creators` | Core directory — name, email, skills, bio, socials, avatar, auth_id, claimed, slug, can_teach, wants_to_learn, badges, email_prefs |
| `events` | Community events — title, date, location, max_capacity, facebook_url |
| `rsvps` | Event RSVPs — user_id, event_id, status (confirmed/waitlisted/checked_in/no_show), checked_in_at |
| `announcements` | Broadcast email history |
| `projects` | Creator portfolio items with YouTube embeds |
| `project_images` | Images for portfolio projects |
| `collab_posts` | Collaboration board — type (looking_for/offering), title, category, budget, deadline, status |
| `collab_responses` | Responses to collab posts with accept/decline status |
| `resources` | Community resource library — equipment, studio space, software, etc. |
| `resource_requests` | Requests to borrow resources with approve/decline |
| `challenges` | Monthly creative challenges — title, description, month, year, deadline |
| `challenge_submissions` | Submissions to challenges — title, media_url, link_url |
| `business_inquiries` | Hire-a-creator form submissions — business info, creator types needed, admin status tracking |
| `creator_points` | XP/points system — action_type, points, creator_id |
| `spotlights` | Creator of the Month selections — creator_id, month, year |
| `connections` | Creator-to-creator connection requests |
| `page_views` | Analytics — page path, referrer, user_id |
| `profile_views` | Analytics — which profiles get viewed |
| `error_reports` | Auto-reported client errors |

---

## Feature Map

### Public Pages

| Route | Purpose | Auth Required |
|-------|---------|--------------|
| `/` | Animated landing page with scenes | No |
| `/directory` | Creator directory with search/filter + feature nav tabs | No |
| `/directory/[slug]` | Individual creator profile | No |
| `/collaborate` | Collaboration board — post needs, offer skills | Post/respond: Yes |
| `/collaborate/[id]` | Post detail — responses, accept/decline | Yes (author) |
| `/resources` | Community resource library | List/request: Yes |
| `/resources/[id]` | Resource detail — requests, approve/decline | Yes (owner) |
| `/challenges` | Monthly creative challenges + gallery | Submit: Yes |
| `/challenges/[id]` | Challenge detail + submissions | Submit: Yes |
| `/learn` | Skills exchange — teach/learn matching | View matches: Yes |
| `/hire` | Public hire-a-creator form (Turnstile protected) | No |
| `/spotlight` | Creator of the Month + past spotlights | No |
| `/events/[id]/checkin` | iPad check-in page for events | Admin only |
| `/auth/login` | Login | No |
| `/auth/signup` | Signup (supports invite tokens) | No |
| `/auth/forgot-password` | Password reset initiation | No |
| `/auth/reset-password` | Password reset completion | No |
| `/profile/edit` | Edit own profile | Yes |
| `/onboarding` | Post-signup onboarding wizard | Yes |

### Admin Pages (all require admin email)

| Route | Purpose |
|-------|---------|
| `/admin` | Dashboard — stats, quick actions |
| `/admin/creators` | Creator management — CRUD, bulk actions, CSV export |
| `/admin/events` | Event CRUD with RSVP counts |
| `/admin/invites` | Send invitation emails to unclaimed creators |
| `/admin/announcements` | Broadcast emails to community |
| `/admin/collaborate` | Moderate collab posts |
| `/admin/resources` | Moderate resource listings |
| `/admin/challenges` | Create/manage monthly challenges |
| `/admin/inquiries` | Track business hire requests — status pipeline, notes, referrals |
| `/admin/spotlight` | XP leaderboard, select Creator of the Month |
| `/admin/analytics` | Traffic charts, top pages, error log, signups |
| `/admin/settings` | Env var status, admin email list |

---

## Key Architecture Patterns

### Supabase Client Usage
- **Browser client** (`src/lib/supabase.ts`): `createClient()` with `cookieEncoding: "raw"`
- **Server client** (`src/lib/supabase-server.ts`): `createServerSupabaseClient()` — reads cookies, respects RLS
- **Admin client** (`src/lib/supabase-server.ts`): `getSupabaseAdmin()` — service role, bypasses RLS, lazy-initialized
- `cookieEncoding: "raw"` is critical — the default base64url encoding causes `"Failed to execute fetch: Invalid value"` errors

### Server Actions Pattern
All mutations go through server actions in `src/app/actions/`:
```
const supabase = await createServerSupabaseClient();
const { data: { user } } = await supabase.auth.getUser();
// ... validate auth ...
const result = await getSupabaseAdmin().from("table").insert(data);
```

### Admin Check
```typescript
import { isAdmin } from "@/lib/admin";
// isAdmin(email) checks against ADMIN_EMAILS array
```

### Points System
`awardPoints(creatorId, actionType)` — called after successful actions (RSVP, collab post, connection, etc.). Only awards to claimed creators. Points feed the leaderboard at `/admin/spotlight`.

### Email System
- **App emails** (invites, announcements, inquiry notifications, spotlight): Resend via `src/lib/email.ts`
- **Auth emails** (confirmation, password reset): Supabase Auth SMTP configured to use Resend SMTP (`smtp.resend.com:465`)
- FROM address: `hello@creatorspacefw.com`

---

## Event System Details

- Events have optional `max_capacity` — when set, RSVPs beyond capacity get `status: "waitlisted"`
- Check-in page at `/events/[id]/checkin` (iPad-optimized, admin-only)
- After events: admin can "Mark No-Shows" which sets unchecked-in confirmed RSVPs to `no_show`
- Waitlisted creators auto-promote when spots open via `promoteFromWaitlist()`

---

## What Was Done (Session History)

### Session 1 (earlier)
- Built initial landing page with animated scenes (GSAP)
- Created creator directory with 147 seeded entries
- Auth system (login, signup, profile edit)
- Admin dashboard with creator management, events, invites, announcements
- Invite email flow with token-based profile claiming
- Fixed multiple Vercel build errors (getYoutubeEmbedUrl async, Resend lazy-init, Suspense boundary)

### Session 2 (earlier)
- Fixed cookie encoding (`cookieEncoding: "raw"`) across all 4 Supabase clients
- Fixed forgot/reset password flow (PASSWORD_RECOVERY event + session check + timeout)
- Password visibility toggle + strength meter
- Footer overflow fix, mobile constellation performance
- Branded Supabase auth emails
- Admin analytics dashboard, page view tracking, error boundary
- Profile completeness, badges, connect button, share profiles
- Custom 404 page, avatar validation

### Session 3 (current)
- Fixed invite/announcement emails not sending (Resend domain was sweetdreamsmusic.com not creatorspacefw.com, then fixed FROM to hello@creatorspacefw.com)
- Fixed redirect loop (GoDaddy A record → wrong IP + www redirect conflict)
- Per-platform social link fields (Instagram, TikTok, YouTube, X, LinkedIn, Facebook)
- Facebook event URL field on events + attending creators display
- **6 Major Features:**
  1. Points/XP system + Creator Spotlight
  2. Skills Exchange (teach/learn matching)
  3. Collaboration Board (post needs, offer skills, respond, accept/decline)
  4. Resource Sharing (equipment, studio, software, etc.)
  5. Monthly Challenges (creative prompts + gallery)
  6. Business Inquiry Board (/hire — public form, admin tracking)
- Event waitlist system + iPad check-in page
- Feature navigation tabs on directory page
- SEO metadata for all new pages, updated sitemap
- Full security audit: fixed auth spoofing, ownership checks, XSS in emails, filter bugs
- Command palette + nav updated with all features
- Supabase custom SMTP configured for auth emails

---

## Known Issues / Future Work

- **RLS policies are overly permissive** — some tables (events, announcements) treat any authenticated user as admin in Postgres policies. Mitigated by using `getSupabaseAdmin()` in code, but the anon client could bypass app-level checks.
- **N+1 query pattern** on collab and challenges pages — each post fetches response count individually. Should batch with GROUP BY.
- **Admin email list is hardcoded** in `src/lib/admin.ts` — could move to DB or env var.
- **No route-level error.tsx files** — Next.js will show raw errors on server component failures.
- **Event recap/gallery system** — tables exist (event_recaps, event_photos) but no UI built yet.
- **Direct messaging** between creators — not built, connections are request-only.
- **Collaboration board notifications** — no email sent when someone responds to your post.
- **Resource image upload** — field exists but no Supabase Storage integration for resource photos.
- **llms.txt** files exist for AI SEO but may need updating with new features.
- **No tests** — zero test coverage across the project.

---

## File Structure Overview

```
src/
├── app/
│   ├── actions/          # Server actions (auth, admin, collaborate, resources, challenges, etc.)
│   ├── admin/            # Admin pages (12 total)
│   ├── api/              # API routes (announcements, invites, instagram)
│   ├── auth/             # Auth pages (login, signup, forgot-password, reset-password, callback)
│   ├── challenges/       # Monthly challenges pages
│   ├── collaborate/      # Collaboration board pages
│   ├── directory/        # Creator directory + profiles
│   ├── events/           # Event check-in page
│   ├── hire/             # Public hire form
│   ├── learn/            # Skills exchange page
│   ├── onboarding/       # Post-signup wizard
│   ├── profile/          # Profile edit pages
│   ├── resources/        # Resource sharing pages
│   ├── spotlight/        # Creator spotlight page
│   ├── layout.tsx        # Root layout (fonts, metadata, ErrorBoundary, PageViewTracker)
│   ├── page.tsx          # Home page (scene orchestrator)
│   ├── sitemap.ts        # Dynamic sitemap
│   ├── robots.ts         # Robots.txt
│   └── manifest.ts       # PWA manifest
├── components/
│   ├── admin/            # AdminSidebar
│   ├── providers/        # AuthProvider
│   ├── scenes/           # Landing page scene components (Scene1-8, SceneSpotlight)
│   ├── tracking/         # PageViewTracker
│   └── ui/               # Reusable UI components (30+)
├── lib/
│   ├── admin.ts          # Admin email whitelist
│   ├── email.ts          # Resend email functions
│   ├── gsap.ts           # GSAP registration
│   ├── social-parser.ts  # Social link URL parser
│   ├── supabase.ts       # Browser Supabase client
│   ├── supabase-server.ts # Server + admin Supabase clients
│   ├── turnstile.ts      # Cloudflare Turnstile verification
│   └── youtube.ts        # YouTube URL parser
└── supabase/
    └── migrations/       # SQL migration files (11 total)
```
