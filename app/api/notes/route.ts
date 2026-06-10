import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// GET /api/notes — retrieve all notes for the couple
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const notes = await prisma.note.findMany({
      where: { coupleId },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" },
      ],
    });

    return apiSuccess({ notes });
  } catch (error) {
    console.error("Fetch notes error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/notes — create a new note for the couple
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const { title, content, color = "#d946ef", isPinned = false } = await request.json();

    if (!title?.trim() || !content?.trim()) {
      return apiError("Title and content are required", 400);
    }

    const note = await prisma.note.create({
      data: {
        coupleId,
        createdById: prismaUserId,
        title: title.trim(),
        content: content.trim(),
        color,
        isPinned,
      },
    });

    return apiSuccess({ note }, 201);
  } catch (error) {
    console.error("Create note error:", error);
    return apiError("Something went wrong", 500);
  }
}
