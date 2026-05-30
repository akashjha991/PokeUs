import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";

/**
 * GET /api/auth/callback
 *
 * Supabase redirects here after:
 *   - Email verification (user clicks the link in the verification email)
 *   - Password reset (user clicks the link in the reset email)
 *
 * Query params provided by Supabase:
 *   ?code=<pkce_code>  — exchange for a session
 *   ?error=...         — error message from Supabase
 *   ?type=signup|recovery|email_change
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const type = searchParams.get("type"); // "signup" | "recovery" | "email_change"

  // Handle errors from Supabase
  if (error) {
    console.error("Supabase callback error:", error, errorDescription);
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set(
      "error",
      errorDescription || "Verification failed. Please try again."
    );
    return NextResponse.redirect(loginUrl);
  }

  if (!code) {
    return NextResponse.redirect(new URL("/login", origin));
  }

  try {
    const supabase = await createSupabaseServerClient();

    // Exchange the PKCE code for a session — this also sets session cookies
    const { error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Session exchange error:", exchangeError);
      const loginUrl = new URL("/login", origin);
      loginUrl.searchParams.set(
        "error",
        "Verification link expired or invalid. Please try again."
      );
      return NextResponse.redirect(loginUrl);
    }

    // Route to the correct destination based on the type of callback
    if (type === "recovery") {
      // Password reset — send to reset password page (session is active)
      return NextResponse.redirect(new URL("/reset-password", origin));
    }

    // Default: email verification → redirect to login with success message
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("verified", "true");
    return NextResponse.redirect(loginUrl);
  } catch (err) {
    console.error("Callback route error:", err);
    return NextResponse.redirect(new URL("/login", origin));
  }
}
