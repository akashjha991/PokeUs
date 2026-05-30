import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    await prisma.message.updateMany({
      where: {
        coupleId,
        senderId: { not: prismaUserId },
        seenAt: null,
      },
      data: { seenAt: new Date() },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Mark messages as seen error:", error);
    return apiError("Something went wrong", 500);
  }
}
