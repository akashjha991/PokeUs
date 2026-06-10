import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { EventType } from "@prisma/client";

// GET /api/calendar — retrieve all events for the couple
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const events = await prisma.calendarEvent.findMany({
      where: { coupleId },
      orderBy: { date: "asc" },
    });

    return apiSuccess({ events });
  } catch (error) {
    console.error("Fetch calendar events error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/calendar — create a new calendar event for the couple
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { title, date, eventType = "OTHER", isRecurring = false } = await request.json();

    if (!title?.trim() || !date) {
      return apiError("Title and date are required", 400);
    }

    // Validate eventType
    const validTypes = Object.values(EventType);
    if (!validTypes.includes(eventType as EventType)) {
      return apiError("Invalid event type", 400);
    }

    const event = await prisma.calendarEvent.create({
      data: {
        coupleId,
        createdById: prismaUserId,
        title: title.trim(),
        date: new Date(date),
        eventType: eventType as EventType,
        isRecurring,
      },
    });

    return apiSuccess({ event }, 201);
  } catch (error) {
    console.error("Create calendar event error:", error);
    return apiError("Something went wrong", 500);
  }
}
