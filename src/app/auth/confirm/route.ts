import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/profile/edit";
  const origin = new URL(request.url).origin;

  if (token_hash && type) {
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

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      // Add verified=true param so the reset page knows session was just established
      const successUrl = new URL(`${origin}${next}`);
      successUrl.searchParams.set("verified", "true");
      const successResponse = NextResponse.redirect(successUrl.toString());
      // Copy cookies from the original response to the success response
      response.cookies.getAll().forEach((cookie) => {
        successResponse.cookies.set(cookie.name, cookie.value, {
          path: "/",
          httpOnly: cookie.name.startsWith("sb-"),
          sameSite: "lax",
          secure: true,
        });
      });
      return successResponse;
    }

    // Verification failed — redirect with error
    console.error("Auth confirm verifyOtp failed:", error.message);
    const errorUrl = new URL(`${origin}${next}`);
    errorUrl.searchParams.set("error_description", error.message);
    return NextResponse.redirect(errorUrl.toString());
  }

  // No token_hash — redirect to login
  return NextResponse.redirect(`${origin}/auth/login`);
}
