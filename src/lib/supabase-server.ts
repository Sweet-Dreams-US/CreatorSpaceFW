import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { DB_SCHEMA } from "@/lib/supabase-config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _supabaseAdmin: SupabaseClient<any, any, any> | null = null;

/**
 * Privileged server-only client. On the shared FreeWebsites project it sends the
 * publishable key plus SUPABASE_SERVER_TOKEN (`x-admin-token`); RLS gives that
 * token full access to Creator Space's `csfw` schema and buckets only. Elsewhere
 * it uses SUPABASE_SERVICE_ROLE_KEY as before.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSupabaseAdmin(): SupabaseClient<any, any, any> {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const token = process.env.SUPABASE_SERVER_TOKEN;
    const key = token ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY : process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error("Missing SUPABASE_SERVER_TOKEN or SUPABASE_SERVICE_ROLE_KEY");
    _supabaseAdmin = createClient(url, key, {
      db: { schema: DB_SCHEMA },
      auth: { autoRefreshToken: false, persistSession: false },
      global: token ? { headers: { "x-admin-token": token } } : undefined,
    });
  }
  return _supabaseAdmin;
}

type AuthError = { message: string } | null;
type LoginUser = { id: string; email?: string };

/**
 * The slice of supabase.auth.admin this app uses, same call shapes. With the
 * server token it calls csfw.auth_admin_* database functions, which only see
 * logins tagged for Creator Space.
 */
export function authAdmin() {
  const svc = getSupabaseAdmin();
  if (!process.env.SUPABASE_SERVER_TOKEN) {
    const admin = svc.auth.admin;
    return {
      async getUserById(id: string) {
        const { data, error } = await admin.getUserById(id);
        return { data: { user: (data?.user ?? null) as LoginUser | null }, error: error as AuthError };
      },
      async deleteUser(id: string) {
        const { error } = await admin.deleteUser(id);
        return { error: error as AuthError };
      },
    };
  }
  return {
    async getUserById(id: string) {
      const { data, error } = await svc.rpc("auth_admin_get", { p_id: id });
      return { data: { user: error ? null : ((data ?? null) as LoginUser | null) }, error: error as AuthError };
    },
    async deleteUser(id: string) {
      const { error } = await svc.rpc("auth_admin_delete", { p_id: id });
      return { error: error as AuthError };
    },
  };
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieEncoding: "raw",
      db: { schema: DB_SCHEMA },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from Server Component — ignore
          }
        },
      },
    }
  );
}
