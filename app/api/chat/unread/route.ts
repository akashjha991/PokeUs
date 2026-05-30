import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    const unreadCount = await prisma.message.count({
      where: {
        coupleId,
        senderId: { not: prismaUserId },
        seenAt: null,
      },
    });

    return apiSuccess({ unreadCount });
  } catch (error) {
    console.error("Fetch unread count error:", error);
    return apiError("Something went wrong", 500);
  }
}
