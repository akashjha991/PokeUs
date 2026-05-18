import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    let payload;
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    if (!payload.coupleId) {
      return apiError("Not in a couple", 400);
    }

    // Find the couple to determine the partner's ID
    const couple = await prisma.couple.findUnique({
      where: { id: payload.coupleId as string },
    });

    if (!couple) {
      return apiError("Couple space not found", 404);
    }

    const partnerId = couple.user1Id === payload.userId ? couple.user2Id : couple.user1Id;

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
