import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(_request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return apiError("Unauthorized", 401);
    }

    // Fetch the linked Prisma user by Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        clerkId: true,
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
      // Auto-provision: if Clerk user exists but no Prisma record yet, create it
      const clerkUser = await currentUser();
      if (!clerkUser) return apiError("Unauthorized", 401);

      const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
      const name =
        `${clerkUser.firstName ?? ""} ${clerkUser.lastName ?? ""}`.trim() ||
        email.split("@")[0];

      const newUser = await prisma.user.create({
        data: {
          clerkId: userId,
          email,
          name,
          isVerified: true,
        },
        select: {
          id: true,
          clerkId: true,
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

      return apiSuccess({ user: newUser, couple: null });
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
