import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { memorySchema } from "@/backend/validations";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { coupleId } = auth.context;

  try {
    const memories = await prisma.memory.findMany({
      where: { coupleId },
      orderBy: { date: "desc" },
      include: { photos: true },
    });

    return apiSuccess({ memories });
  } catch (error) {
    console.error("Fetch memories error:", error);
    return apiError("Something went wrong", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { prismaUserId, coupleId } = auth.context;

  try {
    const body = await request.json();
    const parsed = memorySchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { title, caption } = parsed.data;
    const { photoUrl } = body;

    // Validate photo URL if provided
    if (photoUrl) {
      try {
        const url = new URL(photoUrl);
        if (url.protocol !== "https:") {
          return apiError("Photo must be a secure HTTPS URL", 400);
        }
        if (!url.hostname.includes("cloudinary.com")) {
          return apiError("Photo URL domain is not trusted", 400);
        }
      } catch {
        return apiError("Invalid photo URL format", 400);
      }
    }

    const memory = await prisma.memory.create({
      data: {
        title: title.trim(),
        caption: caption ? caption.trim() : null,
        createdById: prismaUserId,
        coupleId,
        photos: photoUrl ? {
          create: {
            url: photoUrl,
            publicId: "local_base64",
          }
        } : undefined
      },
      include: {
        photos: true
      }
    });

    // Award XP for creating a memory and run badges check asynchronously
    const { awardXP, checkAndAwardBadges } = await import("@/backend/services/gamification");
    awardXP(prismaUserId, 25, "Created a shared memory 📷")
      .then(() => checkAndAwardBadges(prismaUserId))
      .catch((err) => console.error("Memory gamification error:", err));

    return apiSuccess({ memory }, 201);
  } catch (error) {
    console.error("Create memory error:", error);
    return apiError("Something went wrong", 500);
  }
}
