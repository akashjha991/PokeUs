import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { coupleId } = auth.context;

  try {
    const { messageId, reaction } = await request.json();

    if (!messageId) {
      return apiError("Message ID is required", 400);
    }

    // Ensure the message exists and belongs to the couple's chat
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        coupleId,
      },
    });

    if (!message) {
      return apiError("Message not found", 404);
    }

    // Update the reaction
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { reaction: reaction || null },
    });

    return apiSuccess({ message: updatedMessage });
  } catch (error) {
    console.error("React message error:", error);
    return apiError("Something went wrong", 500);
  }
}
