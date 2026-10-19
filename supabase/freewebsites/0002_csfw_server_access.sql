-- FreeWebsites: Creator Space's server-side access, sign-up tagging and storage.
--
-- Server code used to run as service_role, which on the shared project would
-- unlock every client's data. Instead it sends the publishable key plus a
-- Creator Space-only token (`x-admin-token`). Only the token's sha256 lives in
-- private.csfw_server_token (inserted out of band, never committed).
--
-- With the token a request can:
--   * read and write every csfw.* table and the csfw-* storage buckets,
--   * look up / remove Creator Space logins through csfw.auth_admin_* below,
--     which only touch auth.users rows tagged app_metadata.tenants ? 'csfw'.

create table if not exists private.csfw_server_token (
  token_hash text primary key,
  label      text,
  created_at timestamptz not null default now()
);
alter table private.csfw_server_token enable row level security;
revoke all on table private.csfw_server_token from public, anon, authenticated;

create or replace function private.csfw_server_ok(candidate text)
returns boolean language sql stable security definer
set search_path to 'private', 'extensions', 'pg_temp'
as $$
  select exists (
    select 1 from private.csfw_server_token
    where candidate is not null
      and token_hash = encode(extensions.digest(candidate, 'sha256'), 'hex')
  );
$$;

create or replace function private.csfw_request_is_server()
returns boolean language sql stable
set search_path to 'private', 'pg_temp'
as $$
  select private.csfw_server_ok(
    nullif(current_setting('request.headers', true), '')::json ->> 'x-admin-token'
  );
$$;

revoke all on function private.csfw_server_ok(text), private.csfw_request_is_server() from public;
grant execute on function private.csfw_server_ok(text), private.csfw_request_is_server() to anon, authenticated;

-- Tables: the server token gets what service_role used to.
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'csfw' loop
    execute format(
      'create policy "Creator Space server full access" on csfw.%I for all to anon
         using (private.csfw_request_is_server()) with check (private.csfw_request_is_server())', t);
  end loop;
end $$;

-- Sign-ups from creatorspacefw.com send user_metadata.site = 'csfw'; tag them
-- so csfw.is_member() lets them in. Never blocks a sign-up on any site.
create or replace function private.csfw_tag_signup()
returns trigger language plpgsql security definer set search_path to '' as $$
begin
  if new.raw_user_meta_data ->> 'site' = 'csfw' then
    new.raw_app_meta_data := coalesce(new.raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object('tenants',
           case when jsonb_typeof(new.raw_app_meta_data -> 'tenants') = 'array'
                then case when new.raw_app_meta_data -> 'tenants' ? 'csfw'
                          then new.raw_app_meta_data -> 'tenants'
                          else (new.raw_app_meta_data -> 'tenants') || '["csfw"]'::jsonb end
                else '["csfw"]'::jsonb end);
  end if;
  return new;
exception when others then
  return new;
end $$;
revoke all on function private.csfw_tag_signup() from public, anon, authenticated;

drop trigger if exists csfw_tag_signup on auth.users;
create trigger csfw_tag_signup before insert on auth.users
  for each row execute function private.csfw_tag_signup();

-- Login lookups (replaces auth.admin.getUserById / deleteUser).
create or replace function csfw.auth_admin_get(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path to '' as $$
declare r record;
begin
  if not private.csfw_request_is_server() then raise exception 'unauthorized' using errcode = '42501'; end if;
  select id, email into r from auth.users where id = p_id and raw_app_meta_data -> 'tenants' ? 'csfw';
  if not found then return null; end if;
  return jsonb_build_object('id', r.id, 'email', r.email);
end $$;

create or replace function csfw.auth_admin_delete(p_id uuid)
returns void language plpgsql security definer set search_path to '' as $$
declare v_tenants jsonb;
begin
  if not private.csfw_request_is_server() then raise exception 'unauthorized' using errcode = '42501'; end if;
  select raw_app_meta_data -> 'tenants' into v_tenants from auth.users where id = p_id;
  if v_tenants is null or not v_tenants ? 'csfw' then return; end if;
  if jsonb_array_length(v_tenants) > 1 then
    -- Shared with another site: drop only Creator Space access.
    update auth.users set
      raw_app_meta_data = raw_app_meta_data
        || jsonb_build_object('tenants', (select coalesce(jsonb_agg(e.v), '[]'::jsonb) from jsonb_array_elements(v_tenants) as e(v) where e.v <> '"csfw"'::jsonb)),
      updated_at = now()
    where id = p_id;
  else
    delete from auth.users where id = p_id;
  end if;
end $$;

revoke all on function csfw.auth_admin_get(uuid), csfw.auth_admin_delete(uuid) from public;
grant execute on function csfw.auth_admin_get(uuid), csfw.auth_admin_delete(uuid) to anon, service_role;

-- Storage: same three buckets as before, renamed for the shared project.
insert into storage.buckets (id, name, public) values
  ('csfw-avatars', 'csfw-avatars', true),
  ('csfw-media', 'csfw-media', true),
  ('csfw-resources', 'csfw-resources', true)
on conflict (id) do nothing;

create policy "Creator Space · public avatar read" on storage.objects for select to public
  using (bucket_id = 'csfw-avatars');
create policy "Creator Space · avatar upload" on storage.objects for insert to public
  with check (bucket_id = 'csfw-avatars' and csfw.is_member() and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "Creator Space · avatar update" on storage.objects for update to public
  using (bucket_id = 'csfw-avatars' and csfw.is_member() and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "Creator Space · avatar delete" on storage.objects for delete to public
  using (bucket_id = 'csfw-avatars' and csfw.is_member() and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "Creator Space · resource upload" on storage.objects for insert to public
  with check (bucket_id = 'csfw-resources' and csfw.is_member() and auth.role() = 'authenticated');
create policy "Creator Space · public resource read" on storage.objects for select to public
  using (bucket_id = 'csfw-resources');
create policy "Creator Space · resource update" on storage.objects for update to public
  using (bucket_id = 'csfw-resources' and csfw.is_member() and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "Creator Space · resource delete" on storage.objects for delete to public
  using (bucket_id = 'csfw-resources' and csfw.is_member() and (auth.uid())::text = (storage.foldername(name))[1]);
create policy "Creator Space · server all" on storage.objects for all to anon
  using (bucket_id in ('csfw-avatars', 'csfw-media', 'csfw-resources') and private.csfw_request_is_server())
  with check (bucket_id in ('csfw-avatars', 'csfw-media', 'csfw-resources') and private.csfw_request_is_server());

-- Expose the schema to the Data API.
alter role authenticator set pgrst.db_schemas = 'public, graphql_public, tytspring, jsc, ibe, vh, bad, csfw';
notify pgrst, 'reload config';
notify pgrst, 'reload schema';
