import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  try {
    // Get session from Supabase (reads cookies automatically)
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: supabaseUser },
      error,
    } = await supabase.auth.getUser();

    if (error || !supabaseUser) {
      return apiError("Unauthorized", 401);
    }

    // Fetch the linked Prisma user
    const user = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
      select: {
        id: true,
        supabaseId: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        role: true,
        isVerified: true,
        xpPoints: true,
        streakDays: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    // Sync active streak asynchronously
    const { updateActiveStreak } = await import(
      "@/backend/services/gamification"
    );
    updateActiveStreak(user.id).catch((err) =>
      console.error("Streak error:", err)
    );

    // Fetch couple
    const couple = await prisma.couple.findFirst({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
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

    return apiSuccess({ user, couple });
  } catch (error) {
    console.error("Get me error:", error);
    return apiError("Unauthorized", 401);
  }
}
