import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// GET /api/flashback — "this day last year" memories and moods
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const today = new Date();
    const lastYear = new Date(today);
    lastYear.setFullYear(lastYear.getFullYear() - 1);

    // Window: ±3 days around this day last year
    const from = new Date(lastYear);
    from.setDate(from.getDate() - 3);
    const to = new Date(lastYear);
    to.setDate(to.getDate() + 3);

    const [memories, moods] = await Promise.all([
      prisma.memory.findMany({
        where: { coupleId, date: { gte: from, lte: to } },
        include: { photos: { take: 1 }, createdBy: { select: { id: true, name: true } } },
        take: 5,
      }),
      prisma.moodEntry.findMany({
        where: { coupleId, date: { gte: from, lte: to } },
        include: { user: { select: { id: true, name: true } } },
        take: 10,
      }),
    ]);

    return apiSuccess({ memories, moods, referenceDate: lastYear });
  } catch (error) {
    console.error("Flashback error:", error);
    return apiError("Something went wrong", 500);
  }
}
