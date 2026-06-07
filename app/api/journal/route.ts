import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { uploadImage } from "@/backend/lib/cloudinary";
import { z } from "zod";

const journalSchema = z.object({
  title: z.string().min(1).max(150),
  content: z.string().min(1),
  mood: z.string().optional(),
  photoUrl: z.string().optional(),
  isPrivate: z.boolean().default(false),
});

// GET /api/journal
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 10;

  try {
    const entries = await prisma.journalEntry.findMany({
      where: {
        coupleId,
        OR: [
          { isPrivate: false },
          { isPrivate: true, createdById: prismaUserId },
        ],
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    const total = await prisma.journalEntry.count({
      where: {
        coupleId,
        OR: [{ isPrivate: false }, { isPrivate: true, createdById: prismaUserId }],
      },
    });

    return apiSuccess({ entries, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Get journal error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/journal
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const body = await request.json();
    const parsed = journalSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    let { title, content, mood, photoUrl, isPrivate } = parsed.data;

    // Upload photo if base64
    if (photoUrl?.startsWith("data:image/")) {
      try {
        const result = await uploadImage(photoUrl, "journal");
        photoUrl = result.url;
      } catch {
        return apiError("Failed to upload photo", 500);
      }
    }

    const entry = await prisma.journalEntry.create({
      data: { coupleId, createdById: prismaUserId, title, content, mood, photoUrl, isPrivate },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ entry }, 201);
  } catch (error) {
    console.error("Create journal entry error:", error);
    return apiError("Something went wrong", 500);
  }
}
