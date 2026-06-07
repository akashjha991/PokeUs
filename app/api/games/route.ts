import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { WOULD_YOU_RATHER, COUPLES_QUIZ, TRUTH_OR_DARE } from "@/backend/data/questions";

// GET /api/games — get active session or history
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const sessions = await prisma.gameSession.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { rounds: { orderBy: { createdAt: "asc" } } },
    });
    return apiSuccess({ sessions });
  } catch (error) {
    return apiError("Something went wrong", 500);
  }
}

// POST /api/games — start a new game session
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { gameType = "WOULD_YOU_RATHER" } = await request.json();

    // Pick 5 random questions based on game type
    let pool: { question: string; optionA?: string; optionB?: string }[] = [];
    if (gameType === "WOULD_YOU_RATHER") pool = WOULD_YOU_RATHER;
    else if (gameType === "COUPLES_QUIZ") pool = COUPLES_QUIZ.map((q) => ({ question: q.question }));
    else if (gameType === "TRUTH_OR_DARE") pool = TRUTH_OR_DARE;

    const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 5);

    const session = await prisma.gameSession.create({
      data: {
        coupleId,
        gameType: gameType as any,
        status: "IN_PROGRESS",
        rounds: {
          create: shuffled.map((q) => ({
            question: q.question,
            optionA: q.optionA || null,
            optionB: q.optionB || null,
          })),
        },
      },
      include: { rounds: { orderBy: { createdAt: "asc" } } },
    });

    return apiSuccess({ session }, 201);
  } catch (error) {
    console.error("Create game error:", error);
    return apiError("Something went wrong", 500);
  }
}
