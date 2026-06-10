import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// GET /api/todos — retrieve all todos for the couple
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const todos = await prisma.todoItem.findMany({
      where: { coupleId },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess({ todos });
  } catch (error) {
    console.error("Fetch todos error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/todos — create a new todo for the couple
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const { title } = await request.json();

    if (!title?.trim()) {
      return apiError("Title is required", 400);
    }

    const todo = await prisma.todoItem.create({
      data: {
        coupleId,
        title: title.trim(),
        isDone: false,
      },
    });

    return apiSuccess({ todo }, 201);
  } catch (error) {
    console.error("Create todo error:", error);
    return apiError("Something went wrong", 500);
  }
}
