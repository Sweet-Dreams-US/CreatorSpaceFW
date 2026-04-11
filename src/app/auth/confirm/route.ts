import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase-server";

// This route handles email OTP verification (password reset, email confirm, etc.)
// Uses the same createServerSupabaseClient that the rest of the app uses,
// which properly reads/writes cookies via next/headers.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/profile/edit";

  if (token_hash && type) {
    const supabase = await createServerSupabaseClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      redirect(next);
    }

    // Verification failed — redirect with error
    redirect(`${next}?error_description=${encodeURIComponent(error.message)}`);
  }

  redirect("/auth/login");
}
