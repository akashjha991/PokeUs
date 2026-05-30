import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { supabaseAdmin } from "@/backend/lib/supabase";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { loginSchema } from "@/backend/validations";
import { apiError } from "@/backend/lib/utils";
import { checkRateLimit, getClientIp } from "@/backend/lib/rateLimit";

export async function POST(request: NextRequest) {
  // Rate Limiting — 5 requests per 60s per IP
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`${ip}:login`, { limit: 5, windowSeconds: 60 });
  if (!rateLimit.allowed) {
    return apiError("Too many login attempts. Please try again in a minute.", 429);
  }

  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { email, password } = parsed.data;

    // Sign in via Supabase Auth
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.signInWithPassword({ email, password });

    if (authError || !authData?.user) {
      // Surface friendly messages
      if (
        authError?.message.toLowerCase().includes("email not confirmed") ||
        authError?.message.toLowerCase().includes("not confirmed")
      ) {
        return NextResponse.json(
          { requiresVerification: true, email },
          { status: 200 }
        );
      }
      return apiError("Invalid email or password", 401);
    }

    const supabaseUser = authData.user;

    // Block login if email not verified
    if (!supabaseUser.email_confirmed_at) {
      return NextResponse.json(
        { requiresVerification: true, email },
        { status: 200 }
      );
    }

    // Fetch or auto-create the linked Prisma user
    let prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
    });

    if (!prismaUser) {
      // Fallback: look up by email (handles legacy accounts)
      prismaUser = await prisma.user.findUnique({ where: { email } });
      if (prismaUser) {
        // Link existing legacy user to Supabase
        prismaUser = await prisma.user.update({
          where: { id: prismaUser.id },
          data: {
            supabaseId: supabaseUser.id,
            isVerified: true,
            lastActiveAt: new Date(),
          },
        });
      } else {
        // Auto-create Prisma user (shouldn't happen in normal flow)
        const name =
          supabaseUser.user_metadata?.full_name ||
          email.split("@")[0];
        prismaUser = await prisma.user.create({
          data: {
            supabaseId: supabaseUser.id,
            name,
            email,
            isVerified: true,
          },
        });
      }
    } else {
      // Update verification status and last active
      prismaUser = await prisma.user.update({
        where: { id: prismaUser.id },
        data: { isVerified: true, lastActiveAt: new Date() },
      });
    }

    // Fetch couple data
    const couple = await prisma.couple.findFirst({
      where: {
        OR: [{ user1Id: prismaUser.id }, { user2Id: prismaUser.id }],
      },
      include: {
        user1: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            xpPoints: true,
            streakDays: true,
          },
        },
        user2: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            xpPoints: true,
            streakDays: true,
          },
        },
      },
    });

    // Set Supabase session cookies via @supabase/ssr
    const supabase = await createSupabaseServerClient();
    await supabase.auth.setSession({
      access_token: authData.session!.access_token,
      refresh_token: authData.session!.refresh_token,
    });

    return NextResponse.json({
      user: {
        id: prismaUser.id,
        supabaseId: prismaUser.supabaseId,
        name: prismaUser.name,
        email: prismaUser.email,
        avatar: prismaUser.avatar,
        role: prismaUser.role,
        isVerified: prismaUser.isVerified,
        xpPoints: prismaUser.xpPoints,
        streakDays: prismaUser.streakDays,
      },
      couple,
      requiresVerification: false,
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
