import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// PATCH /api/notes/[id] — update or toggle pin a note
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.coupleId !== coupleId) return apiError("Not found", 404);

    const body = await request.json();
    const updated = await prisma.note.update({
      where: { id },
      data: {
        title: body.title !== undefined ? body.title.trim() : undefined,
        content: body.content !== undefined ? body.content.trim() : undefined,
        color: body.color,
        isPinned: body.isPinned,
      },
    });

    return apiSuccess({ note: updated });
  } catch (error) {
    console.error("Update note error:", error);
    return apiError("Something went wrong", 500);
  }
}

// DELETE /api/notes/[id] — delete a note
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const note = await prisma.note.findUnique({ where: { id } });
    if (!note || note.coupleId !== coupleId) return apiError("Not found", 404);

    await prisma.note.delete({ where: { id } });
    return apiSuccess({ message: "Note deleted" });
  } catch (error) {
    console.error("Delete note error:", error);
    return apiError("Something went wrong", 500);
  }
}
