import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// POST /api/daily-question/custom — propose/create a custom question for the couple
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const { question } = await request.json();
    if (!question?.trim()) {
      return apiError("Question text is required", 400);
    }

    const newQ = await prisma.dailyQuestion.create({
      data: {
        question: question.trim(),
        category: `CUSTOM_${coupleId}`,
      },
    });

    return apiSuccess({ question: newQ }, 201);
  } catch (error) {
    console.error("Propose custom question error:", error);
    return apiError("Something went wrong", 500);
  }
}
