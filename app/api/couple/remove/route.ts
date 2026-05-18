import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { verifyAccessToken, signAccessToken, JWTPayload } from "@/backend/lib/auth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    let payload: JWTPayload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      return apiError("Unauthorized", 401);
    }

    if (!payload.coupleId) {
      return apiError("Not in a couple", 400);
    }

    // Use deleteMany to avoid throwing an error if the record is already deleted
    await prisma.couple.deleteMany({
      where: {
        id: payload.coupleId,
      },
    });

    // Mint a new token without the coupleId
    const newPayload: JWTPayload = {
      userId: payload.userId,
      email: payload.email,
    };
    
    const newToken = signAccessToken(newPayload);

    const response = NextResponse.json({ success: true, message: "Connection removed successfully" });
    
    response.cookies.set("access_token", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Remove connection error:", error);
    return apiError("Something went wrong while removing connection", 500);
  }
}
