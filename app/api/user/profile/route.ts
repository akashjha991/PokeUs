import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireAuth } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function PUT(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { prismaUserId } = auth.context;

  try {
    const { name, bio, avatar } = await request.json();

    if (!name || name.trim() === "") {
      return apiError("Name is required", 400);
    }

    // H5 — Validate avatar URL format to prevent injection attacks (e.g., javascript: scheme)
    let validatedAvatar = null;
    if (avatar) {
      try {
        const url = new URL(avatar);
        if (url.protocol !== "https:") {
          return apiError("Avatar must be a secure HTTPS URL", 400);
        }
        // Restrict to trusted domains in next.config.ts if necessary, or just ensure it is HTTPS
        const allowedHosts = [
          "res.cloudinary.com",
          "images.unsplash.com",
          "avatars.githubusercontent.com"
        ];
        const isAllowed = allowedHosts.some(host => url.hostname === host || url.hostname.endsWith("." + host));
        if (!isAllowed) {
          return apiError("Avatar URL domain is not trusted", 400);
        }
        validatedAvatar = url.toString();
      } catch {
        return apiError("Invalid avatar URL format", 400);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: prismaUserId },
      data: { 
        name: name.trim(), 
        bio: bio ? bio.trim() : null,
        ...(avatar !== undefined && { avatar: validatedAvatar }) 
      },
      select: {
        id: true, name: true, email: true, avatar: true, bio: true,
        isVerified: true, xpPoints: true, streakDays: true,
        lastActiveAt: true, createdAt: true,
      },
    });

    return apiSuccess({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return apiError("Something went wrong", 500);
  }
}
