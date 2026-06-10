import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { DAILY_QUESTIONS } from "@/backend/data/questions";

// GET /api/daily-question — get today's question + both answers
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Look for a custom question proposed today for this couple
    let question = await prisma.dailyQuestion.findFirst({
      where: {
        category: `CUSTOM_${coupleId}`,
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!question) {
      // Pick a deterministic question for today using day-of-year
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 0);
      const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);
      const q = DAILY_QUESTIONS[dayOfYear % DAILY_QUESTIONS.length];

      // Get or create the DailyQuestion record
      question = await prisma.dailyQuestion.findFirst({
        where: { question: q.question },
      });
      if (!question) {
        question = await prisma.dailyQuestion.create({
          data: { question: q.question, category: q.category },
        });
      }
    }

    const answers = await prisma.questionAnswer.findMany({
      where: {
        questionId: question.id,
        coupleId,
        createdAt: { gte: today, lt: tomorrow },
      },
      include: { user: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ question, answers, myUserId: prismaUserId });
  } catch (error) {
    console.error("Daily question error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/daily-question — submit an answer
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { questionId, answer } = await request.json();
    if (!questionId || !answer?.trim()) return apiError("Question and answer are required", 400);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert to allow editing within the same day
    const existing = await prisma.questionAnswer.findFirst({
      where: { userId: prismaUserId, questionId, createdAt: { gte: today } },
    });

    let qa;
    if (existing) {
      qa = await prisma.questionAnswer.update({
        where: { id: existing.id },
        data: { answer: answer.trim() },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
    } else {
      qa = await prisma.questionAnswer.create({
        data: { coupleId, userId: prismaUserId, questionId, answer: answer.trim() },
        include: { user: { select: { id: true, name: true, avatar: true } } },
      });
    }

    return apiSuccess({ answer: qa }, 201);
  } catch (error) {
    console.error("Submit answer error:", error);
    return apiError("Something went wrong", 500);
  }
}
