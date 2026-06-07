import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { z } from "zod";

const goalSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(300).optional(),
  category: z.enum(["ADVENTURE","TRAVEL","FOOD","HEALTH","RELATIONSHIP","LEARNING","OTHER"]).default("ADVENTURE"),
  emoji: z.string().max(4).default("🎯"),
  targetDate: z.string().optional(),
});

// GET /api/goals
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const goals = await prisma.goal.findMany({
      where: { coupleId },
      orderBy: [{ isCompleted: "asc" }, { createdAt: "desc" }],
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });
    return apiSuccess({ goals });
  } catch (error) {
    console.error("Get goals error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/goals
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const body = await request.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { title, description, category, emoji, targetDate } = parsed.data;

    const goal = await prisma.goal.create({
      data: {
        coupleId,
        createdById: prismaUserId,
        title,
        description,
        category: category as any,
        emoji,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ goal }, 201);
  } catch (error) {
    console.error("Create goal error:", error);
    return apiError("Something went wrong", 500);
  }
}
