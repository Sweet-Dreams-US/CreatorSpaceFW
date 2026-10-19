import { createBrowserClient } from "@supabase/ssr";
import { DB_SCHEMA } from "@/lib/supabase-config";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    throw new Error(
      "Missing Supabase env vars. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(url, key, {
    cookieEncoding: "raw",
    db: { schema: DB_SCHEMA },
  });
}
