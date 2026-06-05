import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireAuth } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { createClerkClient } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { prismaUserId, clerkUserId } = auth.context;

  try {
    // 1. Delete user from Clerk backend registry
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    if (!clerkSecretKey) {
      console.error("CLERK_SECRET_KEY is not configured");
      return apiError("Server configuration error", 500);
    }
    const clerk = createClerkClient({ secretKey: clerkSecretKey });
    await clerk.users.deleteUser(clerkUserId);

    // 2. Cascade delete Prisma user relations and user record (if not already deleted by webhook)
    const user = await prisma.user.findUnique({ where: { id: prismaUserId } });
    if (user) {
      // Find if they are in a couple and delete the couple
      const userCouple = await prisma.couple.findFirst({
        where: {
          OR: [
            { user1Id: user.id },
            { user2Id: user.id }
          ]
        }
      });
      
      if (userCouple) {
        await prisma.couple.delete({ where: { id: userCouple.id } });
      }

      // Delete invites
      await prisma.coupleInvite.deleteMany({
        where: {
          OR: [
            { senderId: user.id },
            { receiverId: user.id }
          ]
        }
      });

      // Delete user and remaining relations
      await prisma.$transaction([
        prisma.xPLog.deleteMany({ where: { userId: user.id } }),
        prisma.moodEntry.deleteMany({ where: { userId: user.id } }),
        prisma.userBadge.deleteMany({ where: { userId: user.id } }),
        prisma.pushSubscription.deleteMany({ where: { userId: user.id } }),
        prisma.user.delete({ where: { id: user.id } }),
      ]);
    }

    return apiSuccess({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete account error:", error);
    return apiError("Failed to delete account", 500);
  }
}
