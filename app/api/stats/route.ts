import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// GET /api/stats — relationship analytics aggregation
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  try {
    const couple = await prisma.couple.findUnique({
      where: { id: coupleId },
      select: { createdAt: true, anniversaryDate: true, user1Id: true, user2Id: true },
    });
    if (!couple) return apiError("Couple not found", 404);

    const partnerId = couple.user1Id === prismaUserId ? couple.user2Id : couple.user1Id;

    // Days together
    const daysTogether = Math.floor(
      (Date.now() - new Date(couple.createdAt).getTime()) / 86400000
    );

    // Parallel aggregations
    const [
      messageCount,
      memoryCount,
      moodEntries,
      goalCount,
      goalsCompleted,
      journalCount,
      calendarCount,
    ] = await Promise.all([
      prisma.message.count({ where: { coupleId } }),
      prisma.memory.count({ where: { coupleId } }),
      prisma.moodEntry.findMany({
        where: { coupleId, createdAt: { gte: new Date(Date.now() - 30 * 86400000) } },
        select: { userId: true, mood: true, emoji: true, date: true },
        orderBy: { date: "asc" },
      }),
      prisma.goal.count({ where: { coupleId } }),
      prisma.goal.count({ where: { coupleId, isCompleted: true } }),
      prisma.journalEntry.count({ where: { coupleId } }),
      prisma.calendarEvent.count({ where: { coupleId } }),
    ]);

    // Mood breakdown
    const moodMap: Record<string, number> = {};
    moodEntries.forEach((e) => { moodMap[e.mood] = (moodMap[e.mood] || 0) + 1; });

    // Messages per user
    const [myMessages, partnerMessages] = await Promise.all([
      prisma.message.count({ where: { coupleId, senderId: prismaUserId } }),
      prisma.message.count({ where: { coupleId, senderId: partnerId } }),
    ]);

    // Streak
    const me = await prisma.user.findUnique({
      where: { id: prismaUserId },
      select: { streakDays: true, xpPoints: true },
    });

    return apiSuccess({
      daysTogether,
      messageCount,
      myMessages,
      partnerMessages,
      memoryCount,
      goalCount,
      goalsCompleted,
      journalCount,
      calendarCount,
      moodBreakdown: moodMap,
      moodTimeline: moodEntries,
      streakDays: me?.streakDays || 0,
      xpPoints: me?.xpPoints || 0,
      anniversaryDate: couple.anniversaryDate,
    });
  } catch (error) {
    console.error("Stats error:", error);
    return apiError("Something went wrong", 500);
  }
}
