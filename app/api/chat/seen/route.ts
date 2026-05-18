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

    await prisma.message.updateMany({
      where: {
        coupleId: payload.coupleId as string,
        senderId: { not: payload.userId as string },
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });

    return apiSuccess({ success: true });
  } catch (error) {
    console.error("Mark messages as seen error:", error);
    return apiError("Something went wrong", 500);
  }
}
