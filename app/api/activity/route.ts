import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { coupleId } = auth.context;

  try {
    // 1. Fetch memories
    const memories = await prisma.memory.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { createdBy: { select: { name: true } } }
    });

    // 2. Fetch goals
    const goals = await prisma.goal.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { createdBy: { select: { name: true } } }
    });

    // 3. Fetch journal entries
    const journalEntries = await prisma.journalEntry.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { createdBy: { select: { name: true } } }
    });

    // 4. Fetch expenses
    const expenses = await prisma.expense.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { paidBy: { select: { name: true } } }
    });

    // 5. Fetch calendar events
    const calendarEvents = await prisma.calendarEvent.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { createdBy: { select: { name: true } } }
    });

    const activities: any[] = [];

    memories.forEach(m => {
      activities.push({
        type: "memory",
        icon: "📷",
        text: `${m.createdBy.name} added a memory: "${m.title}"`,
        time: new Date(m.createdAt).getTime(),
        dateStr: new Date(m.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
      });
    });

    goals.forEach(g => {
      activities.push({
        type: "goal",
        icon: g.isCompleted ? "✅" : "🎯",
        text: g.isCompleted 
          ? `${g.createdBy.name} achieved the goal: "${g.title}"`
          : `${g.createdBy.name} added a new goal: "${g.title}"`,
        time: new Date(g.createdAt).getTime(),
        dateStr: new Date(g.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
      });
    });

    journalEntries.forEach(j => {
      activities.push({
        type: "journal",
        icon: "📝",
        text: `${j.createdBy.name} wrote a journal entry`,
        time: new Date(j.createdAt).getTime(),
        dateStr: new Date(j.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
      });
    });

    expenses.forEach(e => {
      activities.push({
        type: "expense",
        icon: "💳",
        text: `${e.paidBy.name} added an expense: "${e.title}" (₹${e.amount})`,
        time: new Date(e.createdAt).getTime(),
        dateStr: new Date(e.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
      });
    });

    calendarEvents.forEach(c => {
      activities.push({
        type: "calendar",
        icon: "📅",
        text: `${c.createdBy.name} added a calendar event: "${c.title}"`,
        time: new Date(c.createdAt).getTime(),
        dateStr: new Date(c.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })
      });
    });

    // Sort by timestamp desc, take top 5
    activities.sort((a, b) => b.time - a.time);
    const recentActivities = activities.slice(0, 5);

    return apiSuccess({ activities: recentActivities });
  } catch (error) {
    console.error("Fetch activities error:", error);
    return apiError("Something went wrong", 500);
  }
}
