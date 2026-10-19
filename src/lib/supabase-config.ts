// Where Creator Space lives inside its Supabase project.
//
// On the shared FreeWebsites project the tables sit in the `csfw` schema, the
// buckets are prefixed `csfw-`, and logins are shared with other sites, so only
// logins tagged app_metadata.tenants ? 'csfw' belong here. Unset (the old
// dedicated project) everything falls back to the original names.

export const DB_SCHEMA = process.env.NEXT_PUBLIC_SUPABASE_DB_SCHEMA?.trim() || "public";
export const AVATAR_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET?.trim() || "avatars";
export const MEDIA_BUCKET = process.env.NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET?.trim() || "Media";

/** Tag this site's sign-ups carry (user_metadata.site); the database turns it into app_metadata.tenants. */
export const SITE_TENANT = "csfw";
const TENANT = process.env.NEXT_PUBLIC_SUPABASE_TENANT?.trim() || "";

/** True when this login may use Creator Space. Always true on the old dedicated project. */
export function belongsToSite(appMetadata: Record<string, unknown> | undefined | null): boolean {
  if (!TENANT) return true;
  const tenants = appMetadata?.tenants;
  return Array.isArray(tenants) && tenants.includes(TENANT);
}

export function mediaUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim().replace(/\/$/, "");
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}
