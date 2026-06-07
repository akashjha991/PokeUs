import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// POST /api/poke — send a poke
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { emoji = "👉", message } = await request.json();

    // Resolve partner ID
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { user1Id: true, user2Id: true },
    });
    if (!couple) return apiError("Couple not found", 404);

    const toId = couple.user1Id === prismaUserId ? couple.user2Id : couple.user1Id;

    const poke = await prisma.poke.create({
      data: { coupleId, fromId: prismaUserId, toId, emoji, message },
      include: { from: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ poke }, 201);
  } catch (error) {
    console.error("Send poke error:", error);
    return apiError("Something went wrong", 500);
  }
}

// GET /api/poke — get unseen pokes for the current user
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId } = auth.context;

  try {
    const pokes = await prisma.poke.findMany({
      where: { toId: prismaUserId, seenAt: null },
      orderBy: { createdAt: "desc" },
      include: { from: { select: { id: true, name: true, avatar: true } } },
      take: 20,
    });

    // Mark as seen
    await prisma.poke.updateMany({
      where: { toId: prismaUserId, seenAt: null },
      data: { seenAt: new Date() },
    });

    return apiSuccess({ pokes });
  } catch (error) {
    console.error("Get pokes error:", error);
    return apiError("Something went wrong", 500);
  }
}
