import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { verifyAccessToken } from "@/backend/lib/auth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    const payload = verifyAccessToken(token);

    // Sync active streak and evaluate badges on session refresh asynchronously in the background
    const { updateActiveStreak } = await import("@/backend/services/gamification");
    updateActiveStreak(payload.userId).catch((err) => console.error("Streak error:", err));

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true, name: true, email: true, avatar: true, bio: true,
        isVerified: true, xpPoints: true, streakDays: true,
        lastActiveAt: true, createdAt: true,
      },
    });

    if (!user) return apiError("User not found", 404);

    const couple = await prisma.couple.findFirst({
      where: { OR: [{ user1Id: user.id }, { user2Id: user.id }] },
      include: {
        user1: { select: { id: true, name: true, email: true, avatar: true, xpPoints: true, streakDays: true } },
        user2: { select: { id: true, name: true, email: true, avatar: true, xpPoints: true, streakDays: true } },
      },
    });

    return apiSuccess({ user, couple });
  } catch (error) {
    console.error("Get me error:", error);
    return apiError("Unauthorized", 401);
  }
}
