import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { jwtVerify } from "jose";

export async function PUT(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);

    let payload;
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    const { name, bio, avatar } = await request.json();

    if (!name || name.trim() === "") {
      return apiError("Name is required", 400);
    }

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId as string },
      data: { 
        name: name.trim(), 
        bio: bio ? bio.trim() : null,
        ...(avatar !== undefined && { avatar }) 
      },
      select: {
        id: true, name: true, email: true, avatar: true, bio: true,
        isVerified: true, xpPoints: true, streakDays: true,
        lastActiveAt: true, createdAt: true,
      },
    });

    return apiSuccess({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return apiError("Something went wrong", 500);
  }
}
