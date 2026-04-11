import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/profile/edit";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookieEncoding: "raw",
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }

    // Code exchange failed — redirect to next page with error info
    // so the page can show a helpful message
    console.error("Auth callback code exchange failed:", error.message);
    const errorUrl = new URL(`${origin}${next}`);
    errorUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(errorUrl.toString());
  }

  // No code param — check for error params and forward them
  const errorDesc = searchParams.get("error_description");
  if (errorDesc && next !== "/profile/edit") {
    const errorUrl = new URL(`${origin}${next}`);
    errorUrl.searchParams.set("error_description", errorDesc);
    return NextResponse.redirect(errorUrl.toString());
  }

  return NextResponse.redirect(`${origin}/auth/login`);
}
