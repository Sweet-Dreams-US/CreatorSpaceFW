-- FreeWebsites: Creator Space tables in the csfw schema (generated from the old project's public schema).
-- RLS policies that used auth.uid()/auth.role() are wrapped in csfw.is_member() so logins from other
-- sites on the shared project get nothing.

create schema if not exists csfw;
create or replace function csfw.is_member() returns boolean language sql stable set search_path = '' as $$ select coalesce((auth.jwt() -> 'app_metadata' -> 'tenants') ? 'csfw', false) $$;
set search_path = csfw, extensions, pg_temp;
create table csfw.creators (id uuid default gen_random_uuid() not null, first_name text, last_name text, email text, social text, company text, job_title text, skills text, created_at timestamp with time zone default now(), auth_id uuid, slug text, avatar_url text, bio text, website text, claimed boolean default false, updated_at timestamp with time zone default now(), invite_token uuid default gen_random_uuid(), invite_sent_at timestamp with time zone, badges text[] default '{}'::text[], location text, email_prefs jsonb default '{"events": true, "connections": true, "announcements": true}'::jsonb, can_teach text[] default '{}'::text[], wants_to_learn text[] default '{}'::text[], role text default 'creator'::text, previous_slugs text[] default ARRAY[]::text[]);
create table csfw.rsvps (id uuid default gen_random_uuid() not null, user_id uuid not null, event_id uuid not null, created_at timestamp with time zone default now() not null, status text default 'confirmed'::text, checked_in_at timestamp with time zone);
create table csfw.events (id uuid default gen_random_uuid() not null, title text not null, description text, date timestamp with time zone not null, location text, image_url text, max_capacity integer, created_by uuid, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), facebook_url text);
create table csfw.announcements (id uuid default gen_random_uuid() not null, subject text not null, body text not null, sent_by uuid, sent_to text default 'all'::text, sent_count integer default 0, created_at timestamp with time zone default now());
create table csfw.projects (id uuid default gen_random_uuid() not null, creator_id uuid not null, title text not null, description text, youtube_url text, link_url text, link_label text, sort_order integer default 0, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now());
create table csfw.project_images (id uuid default gen_random_uuid() not null, project_id uuid not null, image_url text not null, sort_order integer default 0, created_at timestamp with time zone default now());
create table csfw.profile_views (id uuid default gen_random_uuid() not null, creator_id uuid not null, viewer_id uuid, viewed_at timestamp with time zone default now());
create table csfw.connections (id uuid default gen_random_uuid() not null, from_creator_id uuid not null, to_creator_id uuid not null, message text, status text default 'pending'::text, created_at timestamp with time zone default now());
create table csfw.error_reports (id uuid default gen_random_uuid() not null, user_id uuid, page text not null, error_message text not null, user_agent text, extra jsonb, created_at timestamp with time zone default now());
create table csfw.page_views (id uuid default gen_random_uuid() not null, path text not null, user_id uuid, referrer text, created_at timestamp with time zone default now());
create table csfw.event_recaps (id uuid default gen_random_uuid() not null, event_id uuid not null, summary text, created_at timestamp with time zone default now(), video_url text, highlights text);
create table csfw.event_photos (id uuid default gen_random_uuid() not null, event_id uuid not null, image_url text not null, caption text, sort_order integer default 0, created_at timestamp with time zone default now());
create table csfw.creator_points (id uuid default gen_random_uuid() not null, creator_id uuid not null, action_type text not null, points integer not null, reference_id uuid, created_at timestamp with time zone default now());
create table csfw.spotlights (id uuid default gen_random_uuid() not null, creator_id uuid not null, month integer not null, year integer not null, featured_at timestamp with time zone default now());
create table csfw.collab_posts (id uuid default gen_random_uuid() not null, creator_id uuid not null, type text not null, title text not null, description text, category text, budget text, deadline date, status text default 'open'::text not null, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), hidden boolean default false, team_size integer, positions text, scope text);
create table csfw.collab_responses (id uuid default gen_random_uuid() not null, post_id uuid not null, creator_id uuid not null, message text, created_at timestamp with time zone default now(), status text default 'pending'::text);
create table csfw.resources (id uuid default gen_random_uuid() not null, creator_id uuid not null, title text not null, description text, category text not null, availability text default 'available'::text not null, image_url text, terms text default 'free'::text not null, price text, created_at timestamp with time zone default now(), updated_at timestamp with time zone default now(), hidden boolean default false);
create table csfw.resource_requests (id uuid default gen_random_uuid() not null, resource_id uuid not null, creator_id uuid not null, message text, date_needed date, date_return date, status text default 'pending'::text not null, created_at timestamp with time zone default now());
create table csfw.challenges (id uuid default gen_random_uuid() not null, title text not null, description text, month integer not null, year integer not null, status text default 'active'::text not null, submission_deadline timestamp with time zone, created_by uuid, created_at timestamp with time zone default now(), starts_at timestamp with time zone, ends_at timestamp with time zone, rules text, hashtag text, instagram_handle text, show_hashtag boolean default true, show_instagram boolean default true);
create table csfw.challenge_submissions (id uuid default gen_random_uuid() not null, challenge_id uuid not null, creator_id uuid not null, title text not null, description text, media_url text, link_url text, created_at timestamp with time zone default now(), hidden boolean default false);
create table csfw.business_inquiries (id uuid default gen_random_uuid() not null, business_name text not null, contact_name text not null, email text not null, phone text, project_description text not null, budget_range text, timeline text, creator_types text[], status text default 'new'::text not null, admin_notes text, referred_creators uuid[], created_at timestamp with time zone default now(), updated_at timestamp with time zone default now());
create table csfw.challenge_acceptances (id uuid default gen_random_uuid() not null, challenge_id uuid not null, creator_id uuid not null, accepted_at timestamp with time zone default now());
create table csfw.inquiry_referrals (id uuid default gen_random_uuid() not null, inquiry_id uuid not null, creator_id uuid not null, note text, status text default 'pending'::text, created_at timestamp with time zone default now());
create table csfw.platform_updates (id uuid default gen_random_uuid() not null, title text not null, description text not null, level text default 'user'::text, version text, created_at timestamp with time zone default now(), created_by uuid);
create table csfw.feedback (id uuid default gen_random_uuid() not null, creator_id uuid, type text not null, feature text, subject text not null, body text not null, status text default 'new'::text, admin_response text, created_at timestamp with time zone default now());
create table csfw.notifications (id uuid default gen_random_uuid() not null, creator_id uuid not null, type text not null, title text not null, body text, link text, read boolean default false, created_at timestamp with time zone default now());
create table csfw.user_invites (id uuid default gen_random_uuid() not null, inviter_creator_id uuid not null, email text not null, claimed boolean default false, claimed_by_creator_id uuid, created_at timestamp with time zone default now());
create table csfw.challenge_requirements (id uuid default gen_random_uuid() not null, challenge_id uuid not null, title text not null, description text, points integer default 1, sort_order integer default 0, created_at timestamp with time zone default now(), auto_type text, auto_threshold integer default 1);
create table csfw.challenge_requirement_completions (id uuid default gen_random_uuid() not null, requirement_id uuid not null, creator_id uuid not null, completed_at timestamp with time zone default now());
create table csfw.announcement_recipients (id uuid default gen_random_uuid() not null, announcement_id uuid not null, creator_id uuid not null, email text not null, first_name text, status text default 'pending'::text not null, error_message text, sent_at timestamp with time zone, created_at timestamp with time zone default now());
alter table csfw.creators add constraint creators_pkey PRIMARY KEY (id);
alter table csfw.creators add constraint creators_auth_id_key UNIQUE (auth_id);
alter table csfw.creators add constraint creators_slug_key UNIQUE (slug);
alter table csfw.rsvps add constraint rsvps_pkey PRIMARY KEY (id);
alter table csfw.rsvps add constraint rsvps_user_id_event_id_key UNIQUE (user_id, event_id);
alter table csfw.events add constraint events_pkey PRIMARY KEY (id);
alter table csfw.announcements add constraint announcements_pkey PRIMARY KEY (id);
alter table csfw.projects add constraint projects_pkey PRIMARY KEY (id);
alter table csfw.project_images add constraint project_images_pkey PRIMARY KEY (id);
alter table csfw.profile_views add constraint profile_views_pkey PRIMARY KEY (id);
alter table csfw.connections add constraint connections_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])));
alter table csfw.connections add constraint connections_pkey PRIMARY KEY (id);
alter table csfw.connections add constraint connections_from_creator_id_to_creator_id_key UNIQUE (from_creator_id, to_creator_id);
alter table csfw.error_reports add constraint error_reports_pkey PRIMARY KEY (id);
alter table csfw.page_views add constraint page_views_pkey PRIMARY KEY (id);
alter table csfw.event_recaps add constraint event_recaps_pkey PRIMARY KEY (id);
alter table csfw.event_photos add constraint event_photos_pkey PRIMARY KEY (id);
alter table csfw.creator_points add constraint creator_points_pkey PRIMARY KEY (id);
alter table csfw.spotlights add constraint spotlights_month_check CHECK (((month >= 1) AND (month <= 12)));
alter table csfw.spotlights add constraint spotlights_pkey PRIMARY KEY (id);
alter table csfw.spotlights add constraint spotlights_month_year_key UNIQUE (month, year);
alter table csfw.collab_posts add constraint collab_posts_type_check CHECK ((type = ANY (ARRAY['looking_for'::text, 'offering'::text])));
alter table csfw.collab_posts add constraint collab_posts_status_check CHECK ((status = ANY (ARRAY['open'::text, 'filled'::text, 'closed'::text])));
alter table csfw.collab_posts add constraint collab_posts_pkey PRIMARY KEY (id);
alter table csfw.collab_responses add constraint collab_responses_pkey PRIMARY KEY (id);
alter table csfw.collab_responses add constraint collab_responses_post_id_creator_id_key UNIQUE (post_id, creator_id);
alter table csfw.resources add constraint resources_category_check CHECK ((category = ANY (ARRAY['Equipment'::text, 'Studio Space'::text, 'Software'::text, 'Transport'::text, 'Props & Wardrobe'::text, 'Other'::text])));
alter table csfw.resources add constraint resources_availability_check CHECK ((availability = ANY (ARRAY['available'::text, 'reserved'::text, 'unavailable'::text])));
alter table csfw.resources add constraint resources_terms_check CHECK ((terms = ANY (ARRAY['free'::text, 'trade'::text, 'rental'::text])));
alter table csfw.resources add constraint resources_pkey PRIMARY KEY (id);
alter table csfw.resource_requests add constraint resource_requests_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'declined'::text])));
alter table csfw.resource_requests add constraint resource_requests_pkey PRIMARY KEY (id);
alter table csfw.challenges add constraint challenges_month_check CHECK (((month >= 1) AND (month <= 12)));
alter table csfw.challenges add constraint challenges_status_check CHECK ((status = ANY (ARRAY['active'::text, 'past'::text])));
alter table csfw.challenges add constraint challenges_pkey PRIMARY KEY (id);
alter table csfw.challenge_submissions add constraint challenge_submissions_pkey PRIMARY KEY (id);
alter table csfw.challenge_submissions add constraint challenge_submissions_challenge_id_creator_id_key UNIQUE (challenge_id, creator_id);
alter table csfw.business_inquiries add constraint business_inquiries_status_check CHECK ((status = ANY (ARRAY['new'::text, 'reviewing'::text, 'referred'::text, 'completed'::text, 'closed'::text])));
alter table csfw.business_inquiries add constraint business_inquiries_pkey PRIMARY KEY (id);
alter table csfw.rsvps add constraint rsvps_status_check CHECK ((status = ANY (ARRAY['confirmed'::text, 'waitlisted'::text, 'checked_in'::text, 'no_show'::text])));
alter table csfw.collab_responses add constraint collab_responses_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])));
alter table csfw.challenge_acceptances add constraint challenge_acceptances_pkey PRIMARY KEY (id);
alter table csfw.challenge_acceptances add constraint challenge_acceptances_challenge_id_creator_id_key UNIQUE (challenge_id, creator_id);
alter table csfw.inquiry_referrals add constraint inquiry_referrals_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'viewed'::text, 'accepted'::text, 'declined'::text])));
alter table csfw.inquiry_referrals add constraint inquiry_referrals_pkey PRIMARY KEY (id);
alter table csfw.inquiry_referrals add constraint inquiry_referrals_inquiry_id_creator_id_key UNIQUE (inquiry_id, creator_id);
alter table csfw.platform_updates add constraint platform_updates_level_check CHECK ((level = ANY (ARRAY['admin'::text, 'user'::text])));
alter table csfw.platform_updates add constraint platform_updates_pkey PRIMARY KEY (id);
alter table csfw.feedback add constraint feedback_type_check CHECK ((type = ANY (ARRAY['bug'::text, 'feature_request'::text, 'improvement'::text, 'general'::text])));
alter table csfw.feedback add constraint feedback_status_check CHECK ((status = ANY (ARRAY['new'::text, 'reviewing'::text, 'planned'::text, 'resolved'::text, 'wont_fix'::text])));
alter table csfw.feedback add constraint feedback_pkey PRIMARY KEY (id);
alter table csfw.notifications add constraint notifications_type_check CHECK ((type = ANY (ARRAY['connection_request'::text, 'connection_accepted'::text, 'collab_response'::text, 'collab_accepted'::text, 'collab_declined'::text, 'inquiry_referral'::text, 'event_update'::text, 'challenge'::text, 'general'::text])));
alter table csfw.notifications add constraint notifications_pkey PRIMARY KEY (id);
alter table csfw.user_invites add constraint user_invites_pkey PRIMARY KEY (id);
alter table csfw.user_invites add constraint user_invites_inviter_creator_id_email_key UNIQUE (inviter_creator_id, email);
alter table csfw.challenge_requirements add constraint challenge_requirements_pkey PRIMARY KEY (id);
alter table csfw.challenge_requirement_completions add constraint challenge_requirement_completions_pkey PRIMARY KEY (id);
alter table csfw.challenge_requirement_completions add constraint challenge_requirement_completions_requirement_id_creator_id_key UNIQUE (requirement_id, creator_id);
alter table csfw.announcement_recipients add constraint announcement_recipients_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'sent'::text, 'failed'::text])));
alter table csfw.announcement_recipients add constraint announcement_recipients_pkey PRIMARY KEY (id);
alter table csfw.announcement_recipients add constraint announcement_recipients_announcement_id_creator_id_key UNIQUE (announcement_id, creator_id);
alter table csfw.creators add constraint creators_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id);
alter table csfw.rsvps add constraint rsvps_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
alter table csfw.events add constraint events_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table csfw.announcements add constraint announcements_sent_by_fkey FOREIGN KEY (sent_by) REFERENCES auth.users(id);
alter table csfw.rsvps add constraint rsvps_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
alter table csfw.projects add constraint projects_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.project_images add constraint project_images_project_id_fkey FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
alter table csfw.profile_views add constraint profile_views_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.profile_views add constraint profile_views_viewer_id_fkey FOREIGN KEY (viewer_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table csfw.connections add constraint connections_from_creator_id_fkey FOREIGN KEY (from_creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.connections add constraint connections_to_creator_id_fkey FOREIGN KEY (to_creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.error_reports add constraint error_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table csfw.page_views add constraint page_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table csfw.event_recaps add constraint event_recaps_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
alter table csfw.event_photos add constraint event_photos_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;
alter table csfw.creator_points add constraint creator_points_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.spotlights add constraint spotlights_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.collab_posts add constraint collab_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.collab_responses add constraint collab_responses_post_id_fkey FOREIGN KEY (post_id) REFERENCES collab_posts(id) ON DELETE CASCADE;
alter table csfw.collab_responses add constraint collab_responses_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.resources add constraint resources_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.resource_requests add constraint resource_requests_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;
alter table csfw.resource_requests add constraint resource_requests_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.challenge_submissions add constraint challenge_submissions_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
alter table csfw.challenge_submissions add constraint challenge_submissions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.challenge_acceptances add constraint challenge_acceptances_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
alter table csfw.challenge_acceptances add constraint challenge_acceptances_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.inquiry_referrals add constraint inquiry_referrals_inquiry_id_fkey FOREIGN KEY (inquiry_id) REFERENCES business_inquiries(id) ON DELETE CASCADE;
alter table csfw.inquiry_referrals add constraint inquiry_referrals_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.platform_updates add constraint platform_updates_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);
alter table csfw.feedback add constraint feedback_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE SET NULL;
alter table csfw.notifications add constraint notifications_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.user_invites add constraint user_invites_inviter_creator_id_fkey FOREIGN KEY (inviter_creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.user_invites add constraint user_invites_claimed_by_creator_id_fkey FOREIGN KEY (claimed_by_creator_id) REFERENCES creators(id);
alter table csfw.challenge_requirements add constraint challenge_requirements_challenge_id_fkey FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE;
alter table csfw.challenge_requirement_completions add constraint challenge_requirement_completions_requirement_id_fkey FOREIGN KEY (requirement_id) REFERENCES challenge_requirements(id) ON DELETE CASCADE;
alter table csfw.challenge_requirement_completions add constraint challenge_requirement_completions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
alter table csfw.announcement_recipients add constraint announcement_recipients_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE;
alter table csfw.announcement_recipients add constraint announcement_recipients_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES creators(id) ON DELETE CASCADE;
CREATE UNIQUE INDEX creators_slug_unique ON csfw.creators USING btree (slug) WHERE (slug IS NOT NULL);
CREATE UNIQUE INDEX creators_auth_id_unique ON csfw.creators USING btree (auth_id) WHERE (auth_id IS NOT NULL);
CREATE INDEX creators_claimed_idx ON csfw.creators USING btree (claimed);
CREATE INDEX creators_email_idx ON csfw.creators USING btree (email);
CREATE INDEX rsvps_user_id_idx ON csfw.rsvps USING btree (user_id);
CREATE INDEX rsvps_event_id_idx ON csfw.rsvps USING btree (event_id);
CREATE INDEX events_date_idx ON csfw.events USING btree (date);
CREATE INDEX projects_creator_id_idx ON csfw.projects USING btree (creator_id);
CREATE INDEX project_images_project_id_idx ON csfw.project_images USING btree (project_id);
CREATE INDEX profile_views_creator_id_idx ON csfw.profile_views USING btree (creator_id);
CREATE INDEX profile_views_viewed_at_idx ON csfw.profile_views USING btree (viewed_at);
CREATE INDEX connections_from_idx ON csfw.connections USING btree (from_creator_id);
CREATE INDEX connections_to_idx ON csfw.connections USING btree (to_creator_id);
CREATE INDEX error_reports_created_idx ON csfw.error_reports USING btree (created_at);
CREATE INDEX page_views_path_idx ON csfw.page_views USING btree (path);
CREATE INDEX page_views_created_idx ON csfw.page_views USING btree (created_at);
CREATE INDEX idx_creator_points_creator ON csfw.creator_points USING btree (creator_id);
CREATE INDEX idx_creator_points_created ON csfw.creator_points USING btree (created_at);
CREATE INDEX idx_collab_posts_status ON csfw.collab_posts USING btree (status);
CREATE INDEX idx_collab_posts_category ON csfw.collab_posts USING btree (category);
CREATE INDEX idx_collab_posts_creator ON csfw.collab_posts USING btree (creator_id);
CREATE INDEX idx_collab_responses_post ON csfw.collab_responses USING btree (post_id);
CREATE INDEX idx_resources_category ON csfw.resources USING btree (category);
CREATE INDEX idx_resources_availability ON csfw.resources USING btree (availability);
CREATE INDEX idx_resources_creator ON csfw.resources USING btree (creator_id);
CREATE INDEX idx_resource_requests_resource ON csfw.resource_requests USING btree (resource_id);
CREATE INDEX idx_challenge_subs_challenge ON csfw.challenge_submissions USING btree (challenge_id);
CREATE INDEX idx_challenge_subs_creator ON csfw.challenge_submissions USING btree (creator_id);
CREATE INDEX idx_inquiries_status ON csfw.business_inquiries USING btree (status);
CREATE INDEX idx_inquiries_created ON csfw.business_inquiries USING btree (created_at);
CREATE INDEX idx_notifications_creator ON csfw.notifications USING btree (creator_id, created_at DESC);
CREATE INDEX idx_user_invites_inviter ON csfw.user_invites USING btree (inviter_creator_id);
CREATE INDEX idx_user_invites_email ON csfw.user_invites USING btree (email);
CREATE INDEX idx_creators_previous_slugs ON csfw.creators USING gin (previous_slugs);
CREATE INDEX idx_announcement_recipients_status ON csfw.announcement_recipients USING btree (announcement_id, status);
alter table csfw.creators enable row level security;
alter table csfw.rsvps enable row level security;
alter table csfw.events enable row level security;
alter table csfw.announcements enable row level security;
alter table csfw.projects enable row level security;
alter table csfw.project_images enable row level security;
alter table csfw.profile_views enable row level security;
alter table csfw.connections enable row level security;
alter table csfw.error_reports enable row level security;
alter table csfw.page_views enable row level security;
alter table csfw.event_recaps enable row level security;
alter table csfw.event_photos enable row level security;
alter table csfw.creator_points enable row level security;
alter table csfw.spotlights enable row level security;
alter table csfw.collab_posts enable row level security;
alter table csfw.collab_responses enable row level security;
alter table csfw.resources enable row level security;
alter table csfw.resource_requests enable row level security;
alter table csfw.challenges enable row level security;
alter table csfw.challenge_submissions enable row level security;
alter table csfw.business_inquiries enable row level security;
alter table csfw.challenge_acceptances enable row level security;
alter table csfw.inquiry_referrals enable row level security;
alter table csfw.platform_updates enable row level security;
alter table csfw.feedback enable row level security;
alter table csfw.notifications enable row level security;
alter table csfw.user_invites enable row level security;
alter table csfw.challenge_requirements enable row level security;
alter table csfw.challenge_requirement_completions enable row level security;
alter table csfw.announcement_recipients enable row level security;
create policy "Service role manages recipients" on csfw.announcement_recipients as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.role() = 'service_role'::text)));
create policy "Admin manage announcements" on csfw.announcements as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))) with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin read announcements" on csfw.announcements as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin read inquiries" on csfw.business_inquiries as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin update inquiries" on csfw.business_inquiries as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public insert inquiries" on csfw.business_inquiries as PERMISSIVE for INSERT to public with check (true);
create policy "Anyone can view acceptances" on csfw.challenge_acceptances as PERMISSIVE for SELECT to public using (true);
create policy "Authenticated users can accept challenges" on csfw.challenge_acceptances as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.uid() IS NOT NULL)));
create policy "Creators view own completions" on csfw.challenge_requirement_completions as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public read requirements" on csfw.challenge_requirements as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert submissions" on csfw.challenge_submissions as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Owner update submissions" on csfw.challenge_submissions as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public read submissions" on csfw.challenge_submissions as PERMISSIVE for SELECT to public using (true);
create policy "Admin insert challenges" on csfw.challenges as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin update challenges" on csfw.challenges as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public read challenges" on csfw.challenges as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert collab_posts" on csfw.collab_posts as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Owner or admin delete collab_posts" on csfw.collab_posts as PERMISSIVE for DELETE to public using (csfw.is_member() AND (((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid()))) OR (auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))));
create policy "Owner update collab_posts" on csfw.collab_posts as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public read collab_posts" on csfw.collab_posts as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert collab_responses" on csfw.collab_responses as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Public read collab_responses" on csfw.collab_responses as PERMISSIVE for SELECT to public using (true);
create policy "Admin read all connections" on csfw.connections as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Creators manage own connections" on csfw.connections as PERMISSIVE for ALL to public using (csfw.is_member() AND (((from_creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid()))) OR (to_creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid()))))));
create policy "Public read points" on csfw.creator_points as PERMISSIVE for SELECT to public using (true);
create policy "Auth update own" on csfw.creators as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((auth.uid() = auth_id))) with check (csfw.is_member() AND ((auth.uid() = auth_id)));
create policy "Authenticated insert" on csfw.creators as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Public read" on csfw.creators as PERMISSIVE for SELECT to public using (true);
create policy "Public read access" on csfw.creators as PERMISSIVE for SELECT to public using (true);
create policy "Users can update own profile" on csfw.creators as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((auth.uid() = auth_id))) with check (csfw.is_member() AND ((auth.uid() = auth_id)));
create policy "Admin read errors" on csfw.error_reports as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Anyone can insert errors" on csfw.error_reports as PERMISSIVE for INSERT to public with check (true);
create policy "Admin manage photos" on csfw.event_photos as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))) with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public read photos" on csfw.event_photos as PERMISSIVE for SELECT to public using (true);
create policy "Admin manage recaps" on csfw.event_recaps as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))) with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public read recaps" on csfw.event_recaps as PERMISSIVE for SELECT to public using (true);
create policy "Admin manage events" on csfw.events as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))) with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public read events" on csfw.events as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert feedback" on csfw.feedback as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Creators view own feedback" on csfw.feedback as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Creators can view own referrals" on csfw.inquiry_referrals as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Creators mark own as read" on csfw.notifications as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Creators view own notifications" on csfw.notifications as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Admin read page views" on csfw.page_views as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Anyone can insert page views" on csfw.page_views as PERMISSIVE for INSERT to public with check (true);
create policy "Authenticated can view updates" on csfw.platform_updates as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IS NOT NULL)));
create policy "Admin read all views" on csfw.profile_views as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Creators read own views" on csfw.profile_views as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public insert profile views" on csfw.profile_views as PERMISSIVE for INSERT to public with check (true);
create policy "Creators manage own project images" on csfw.project_images as PERMISSIVE for ALL to public using (csfw.is_member() AND ((project_id IN ( SELECT p.id
   FROM (projects p
     JOIN creators c ON ((c.id = p.creator_id)))
  WHERE (c.auth_id = auth.uid())))));
create policy "Public read project_images" on csfw.project_images as PERMISSIVE for SELECT to public using (true);
create policy "Creators manage own projects" on csfw.projects as PERMISSIVE for ALL to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public read projects" on csfw.projects as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert resource_requests" on csfw.resource_requests as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Owner update resource_requests" on csfw.resource_requests as PERMISSIVE for UPDATE to public using (csfw.is_member() AND (((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid()))) OR (resource_id IN ( SELECT resources.id
   FROM resources
  WHERE (resources.creator_id IN ( SELECT creators.id
           FROM creators
          WHERE (creators.auth_id = auth.uid()))))) OR (auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))));
create policy "Public read resource_requests" on csfw.resource_requests as PERMISSIVE for SELECT to public using (true);
create policy "Auth insert resources" on csfw.resources as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.role() = 'authenticated'::text)));
create policy "Owner or admin delete resources" on csfw.resources as PERMISSIVE for DELETE to public using (csfw.is_member() AND (((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid()))) OR (auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text])))))));
create policy "Owner update resources" on csfw.resources as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
create policy "Public read resources" on csfw.resources as PERMISSIVE for SELECT to public using (true);
create policy "Authenticated users can insert own rsvp" on csfw.rsvps as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.uid() = user_id)));
create policy "Public read rsvps" on csfw.rsvps as PERMISSIVE for SELECT to public using (true);
create policy "Users can read own rsvps" on csfw.rsvps as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((auth.uid() = user_id)));
create policy "Users manage own rsvps" on csfw.rsvps as PERMISSIVE for ALL to public using (csfw.is_member() AND ((auth.uid() = user_id))) with check (csfw.is_member() AND ((auth.uid() = user_id)));
create policy "Admin delete spotlights" on csfw.spotlights as PERMISSIVE for DELETE to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin insert spotlights" on csfw.spotlights as PERMISSIVE for INSERT to public with check (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Admin update spotlights" on csfw.spotlights as PERMISSIVE for UPDATE to public using (csfw.is_member() AND ((auth.uid() IN ( SELECT creators.auth_id
   FROM creators
  WHERE (creators.role = ANY (ARRAY['admin'::text, 'board'::text]))))));
create policy "Public read spotlights" on csfw.spotlights as PERMISSIVE for SELECT to public using (true);
create policy "Creators view own invites" on csfw.user_invites as PERMISSIVE for SELECT to public using (csfw.is_member() AND ((inviter_creator_id IN ( SELECT creators.id
   FROM creators
  WHERE (creators.auth_id = auth.uid())))));
revoke all on table csfw.creators from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creators to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creators to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creators to service_role;
revoke all on table csfw.rsvps from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.rsvps to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.rsvps to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.rsvps to service_role;
revoke all on table csfw.events from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.events to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.events to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.events to service_role;
revoke all on table csfw.announcements from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcements to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcements to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcements to service_role;
revoke all on table csfw.projects from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.projects to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.projects to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.projects to service_role;
revoke all on table csfw.project_images from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.project_images to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.project_images to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.project_images to service_role;
revoke all on table csfw.profile_views from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.profile_views to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.profile_views to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.profile_views to service_role;
revoke all on table csfw.connections from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.connections to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.connections to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.connections to service_role;
revoke all on table csfw.error_reports from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.error_reports to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.error_reports to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.error_reports to service_role;
revoke all on table csfw.page_views from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.page_views to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.page_views to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.page_views to service_role;
revoke all on table csfw.event_recaps from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_recaps to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_recaps to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_recaps to service_role;
revoke all on table csfw.event_photos from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_photos to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_photos to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.event_photos to service_role;
revoke all on table csfw.creator_points from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creator_points to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creator_points to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.creator_points to service_role;
revoke all on table csfw.spotlights from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.spotlights to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.spotlights to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.spotlights to service_role;
revoke all on table csfw.collab_posts from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_posts to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_posts to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_posts to service_role;
revoke all on table csfw.collab_responses from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_responses to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_responses to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.collab_responses to service_role;
revoke all on table csfw.resources from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resources to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resources to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resources to service_role;
revoke all on table csfw.resource_requests from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resource_requests to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resource_requests to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.resource_requests to service_role;
revoke all on table csfw.challenges from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenges to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenges to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenges to service_role;
revoke all on table csfw.challenge_submissions from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_submissions to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_submissions to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_submissions to service_role;
revoke all on table csfw.business_inquiries from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.business_inquiries to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.business_inquiries to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.business_inquiries to service_role;
revoke all on table csfw.challenge_acceptances from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_acceptances to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_acceptances to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_acceptances to service_role;
revoke all on table csfw.inquiry_referrals from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.inquiry_referrals to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.inquiry_referrals to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.inquiry_referrals to service_role;
revoke all on table csfw.platform_updates from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.platform_updates to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.platform_updates to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.platform_updates to service_role;
revoke all on table csfw.feedback from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.feedback to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.feedback to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.feedback to service_role;
revoke all on table csfw.notifications from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.notifications to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.notifications to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.notifications to service_role;
revoke all on table csfw.user_invites from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.user_invites to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.user_invites to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.user_invites to service_role;
revoke all on table csfw.challenge_requirements from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirements to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirements to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirements to service_role;
revoke all on table csfw.challenge_requirement_completions from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirement_completions to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirement_completions to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.challenge_requirement_completions to service_role;
revoke all on table csfw.announcement_recipients from anon, authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcement_recipients to anon; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcement_recipients to authenticated; grant INSERT, SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER on table csfw.announcement_recipients to service_role;