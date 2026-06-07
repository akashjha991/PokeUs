import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// PATCH /api/goals/[id] — toggle complete or update
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.coupleId !== coupleId) return apiError("Not found", 404);

    const body = await request.json();
    const updated = await prisma.goal.update({
      where: { id },
      data: {
        ...body,
        completedAt: body.isCompleted ? new Date() : null,
      },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ goal: updated });
  } catch (error) {
    console.error("Update goal error:", error);
    return apiError("Something went wrong", 500);
  }
}

// DELETE /api/goals/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const goal = await prisma.goal.findUnique({ where: { id } });
    if (!goal || goal.coupleId !== coupleId) return apiError("Not found", 404);

    await prisma.goal.delete({ where: { id } });
    return apiSuccess({ message: "Deleted" });
  } catch (error) {
    console.error("Delete goal error:", error);
    return apiError("Something went wrong", 500);
  }
}
