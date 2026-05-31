import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { signupSchema } from "@/backend/validations";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { checkRateLimit, getClientIp } from "@/backend/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate Limiting — 3 requests per 60s per IP
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:register`, { limit: 3, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return apiError("Too many registration attempts. Please try again in a minute.", 429);
  }

  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { name, email, password } = parsed.data;

    // Check if Prisma user already exists (may be from old system)
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing?.supabaseId) {
      return apiError("An account with this email already exists", 409);
    }

    // Create user in Supabase Auth — sends verification email automatically
    const supabase = await createSupabaseServerClient();
    const origin = request.nextUrl.origin;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/api/auth/callback?type=signup`,
        data: {
          full_name: name,
        },
      },
    });

    if (authError) {
      if (authError.message.toLowerCase().includes("already registered")) {
        return apiError("An account with this email already exists", 409);
      }
      console.error("Supabase signup error:", authError);
      return apiError(authError.message || "Failed to create account", 400);
    }

    const supabaseUser = authData.user;
    if (!supabaseUser) {
      return apiError("Failed to create account. Please try again.", 500);
    }

    // Create or update Prisma user linked to this Supabase account
    if (existing) {
      // Link existing legacy Prisma user to new Supabase account
      await prisma.user.update({
        where: { id: existing.id },
        data: { supabaseId: supabaseUser.id, isVerified: false },
      });
    } else {
      // Create fresh Prisma user
      await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          name,
          email,
          isVerified: false,
        },
      });
    }

    return apiSuccess(
      {
        message:
          "Account created! Please check your email for a verification link.",
        email,
        requiresVerification: true,
      },
      201
    );
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
