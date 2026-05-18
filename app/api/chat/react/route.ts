import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
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

    const { messageId, reaction } = await request.json();

    if (!messageId) {
      return apiError("Message ID is required", 400);
    }

    // Ensure the message exists and belongs to the couple's chat
    const message = await prisma.message.findFirst({
      where: {
        id: messageId,
        coupleId: payload.coupleId as string,
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
