import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// PATCH /api/todos/[id] — toggle or update a todo item
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const todo = await prisma.todoItem.findUnique({ where: { id } });
    if (!todo || todo.coupleId !== coupleId) return apiError("Not found", 404);

    const body = await request.json();
    const updated = await prisma.todoItem.update({
      where: { id },
      data: {
        isDone: body.isDone !== undefined ? body.isDone : undefined,
        title: body.title !== undefined ? body.title.trim() : undefined,
      },
    });

    return apiSuccess({ todo: updated });
  } catch (error) {
    console.error("Update todo error:", error);
    return apiError("Something went wrong", 500);
  }
}

// DELETE /api/todos/[id] — delete a todo item
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;
  const { id } = await params;

  try {
    const todo = await prisma.todoItem.findUnique({ where: { id } });
    if (!todo || todo.coupleId !== coupleId) return apiError("Not found", 404);

    await prisma.todoItem.delete({ where: { id } });
    return apiSuccess({ message: "Todo deleted" });
  } catch (error) {
    console.error("Delete todo error:", error);
    return apiError("Something went wrong", 500);
  }
}
