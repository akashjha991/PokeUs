import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    // Find the couple to determine the partner's ID
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) {
      return apiError("Couple space not found", 404);
    }

    const partnerId = couple.user1Id === prismaUserId ? couple.user2Id : couple.user1Id;

    // Fetch the partner's real-time details
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        xpPoints: true,
        streakDays: true,
        lastActiveAt: true,
        createdAt: true,
        // Include unlocked badges
        badges: {
          include: {
            badge: true,
          },
        },
        // Include the last logged mood entry
        moods: {
          orderBy: {
            date: "desc",
          },
          take: 1,
        },
      },
    });

    if (!partner) {
      return apiError("Partner not found", 404);
    }

    return apiSuccess({ partner });
  } catch (error) {
    console.error("Fetch partner profile error:", error);
    return apiError("Something went wrong", 500);
  }
}
