import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { forgotPasswordSchema } from "@/backend/validations";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { checkRateLimit, getClientIp } from "@/backend/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate Limiting — 3 requests per 60s per IP
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:forgot-password`, { limit: 3, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return apiError("Too many password reset requests. Please try again in a minute.", 429);
  }

  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { email } = parsed.data;

    const origin = request.nextUrl.origin;

    const supabase = await createSupabaseServerClient();
    // Supabase sends the password reset email automatically
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/api/auth/callback?type=recovery`,
    });

    if (error) {
      console.error("Supabase forgot password error:", error);
      // Always return success to prevent email enumeration
    }

    return apiSuccess({
      message:
        "If an account with that email exists, you'll receive a password reset link shortly.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("Something went wrong", 500);
  }
}
