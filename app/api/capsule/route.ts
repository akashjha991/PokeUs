import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { uploadImage } from "@/backend/lib/cloudinary";
import { z } from "zod";

const capsuleSchema = z.object({
  title: z.string().min(1).max(100),
  message: z.string().min(1),
  revealDate: z.string().refine((d) => new Date(d) > new Date(), {
    message: "Reveal date must be in the future",
  }),
  photoUrl: z.string().optional(),
});

// GET /api/capsule
export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId } = auth.context;

  try {
    const capsules = await prisma.timeCapsule.findMany({
      where: { coupleId },
      orderBy: { revealDate: "asc" },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    // Lazy reveal: mark as revealed if revealDate has passed
    const now = new Date();
    const updates = capsules.filter((c) => !c.isRevealed && new Date(c.revealDate) <= now);
    if (updates.length > 0) {
      await prisma.timeCapsule.updateMany({
        where: { id: { in: updates.map((c) => c.id) } },
        data: { isRevealed: true, revealedAt: now },
      });
      updates.forEach((c) => { c.isRevealed = true; c.revealedAt = now; });
    }

    return apiSuccess({ capsules });
  } catch (error) {
    console.error("Get capsules error:", error);
    return apiError("Something went wrong", 500);
  }
}

// POST /api/capsule
export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { prismaUserId, coupleId } = auth.context;

  try {
    const body = await request.json();
    const parsed = capsuleSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    let { title, message, revealDate, photoUrl } = parsed.data;

    if (photoUrl?.startsWith("data:image/")) {
      try {
        const result = await uploadImage(photoUrl, "capsules");
        photoUrl = result.url;
      } catch {
        return apiError("Failed to upload photo", 500);
      }
    }

    const capsule = await prisma.timeCapsule.create({
      data: {
        coupleId,
        createdById: prismaUserId,
        title,
        message,
        revealDate: new Date(revealDate),
        photoUrl,
      },
      include: { createdBy: { select: { id: true, name: true, avatar: true } } },
    });

    return apiSuccess({ capsule }, 201);
  } catch (error) {
    console.error("Create capsule error:", error);
    return apiError("Something went wrong", 500);
  }
}
