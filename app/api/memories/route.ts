import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { jwtVerify } from "jose";

// Get user from token
async function getUser(request: NextRequest) {
  const token = request.cookies.get("access_token")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify(token, secret);
    return payload;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getUser(request);
    if (!userPayload) return apiError("Unauthorized", 401);

    const userId = userPayload.userId as string;

    // Get the couple ID for the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        coupleAsUser1: true,
        coupleAsUser2: true,
      }
    });

    const couple = user?.coupleAsUser1[0] || user?.coupleAsUser2[0];
    if (!couple) return apiError("Not in a couple", 400);

    const memories = await prisma.memory.findMany({
      where: { coupleId: couple.id },
      orderBy: { date: "desc" },
      include: { photos: true },
    });

    return apiSuccess({ memories });
  } catch (error) {
    console.error("Fetch memories error:", error);
    return apiError("Something went wrong", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userPayload = await getUser(request);
    if (!userPayload) return apiError("Unauthorized", 401);

    const userId = userPayload.userId as string;
    const { title, caption, photoUrl } = await request.json();

    if (!title || title.trim() === "") {
      return apiError("Title is required", 400);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        coupleAsUser1: true,
        coupleAsUser2: true,
      }
    });

    const couple = user?.coupleAsUser1[0] || user?.coupleAsUser2[0];
    if (!couple) return apiError("Not in a couple", 400);

    const memory = await prisma.memory.create({
      data: {
        title: title.trim(),
        caption: caption ? caption.trim() : null,
        createdById: userId,
        coupleId: couple.id,
        photos: photoUrl ? {
          create: {
            url: photoUrl,
            publicId: "local_base64",
          }
        } : undefined
      },
      include: {
        photos: true
      }
    });

    // Award XP for creating a memory and run badges check asynchronously
    const { awardXP, checkAndAwardBadges } = await import("@/backend/services/gamification");
    awardXP(userId, 25, "Created a shared memory 📷")
      .then(() => checkAndAwardBadges(userId))
      .catch((err) => console.error("Memory gamification error:", err));

    return apiSuccess({ memory }, 201);
  } catch (error) {
    console.error("Create memory error:", error);
    return apiError("Something went wrong", 500);
  }
}
