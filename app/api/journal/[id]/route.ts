import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// DELETE /api/journal/[id]
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;
  const { id } = await params;

  try {
    const entry = await prisma.journalEntry.findUnique({ where: { id } });
    if (!entry || entry.coupleId !== coupleId) return apiError("Not found", 404);
    if (entry.createdById !== prismaUserId) return apiError("Forbidden", 403);

    await prisma.journalEntry.delete({ where: { id } });
    return apiSuccess({ message: "Deleted" });
  } catch (error) {
    return apiError("Something went wrong", 500);
  }
}
