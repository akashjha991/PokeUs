import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// DELETE /api/calendar/[id] — delete a calendar event
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const event = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!event || event.coupleId !== coupleId) return apiError("Not found", 404);

    await prisma.calendarEvent.delete({ where: { id } });
    return apiSuccess({ message: "Event deleted" });
  } catch (error) {
    console.error("Delete calendar event error:", error);
    return apiError("Something went wrong", 500);
  }
}
