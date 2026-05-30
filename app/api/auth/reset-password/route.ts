import { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { z } from "zod";
import { checkRateLimit, getClientIp } from "@/backend/lib/rateLimit";

const resetSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * POST /api/auth/reset-password
 * Called from the /reset-password page after the user has an active
 * Supabase session (established via the callback route or PKCE flow).
 */
export async function POST(request: NextRequest) {
  // Rate Limiting — 3 requests per 60s per IP
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:reset-password`, { limit: 3, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return apiError("Too many password reset attempts. Please try again in a minute.", 429);
  }

  try {
    const body = await request.json();
    const parsed = resetSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { password } = parsed.data;

    const supabase = await createSupabaseServerClient();

    // Verify the user has an active session (from the reset link)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError(
        "Invalid or expired reset link. Please request a new one.",
        401
      );
    }

    // Update the password in Supabase
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      console.error("Supabase reset password error:", error);
      return apiError(error.message || "Failed to reset password", 400);
    }

    // Sign out all other sessions for security
    await supabase.auth.signOut({ scope: "others" });

    return apiSuccess({ message: "Password reset successfully. Please log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("Something went wrong", 500);
  }
}
