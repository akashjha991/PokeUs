import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/backend/lib/db";
import { apiError } from "@/backend/lib/utils";

export interface AuthContext {
  clerkUserId: string;
  prismaUserId: string;
  email: string;
  coupleId: string | null;
  role: string;
}

/**
 * requireAuth — validates the incoming Clerk session.
 *
 * Returns { context } on success or { error: Response } on failure.
 * Usage in route handlers:
 *
 *   const authResult = await requireAuth(request);
 *   if (authResult.error) return authResult.error;
 *   const { prismaUserId, coupleId } = authResult.context;
 */
export async function requireAuth(
  _request: NextRequest
): Promise<{ context: AuthContext; error: null } | { context: null; error: Response }> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { context: null, error: apiError("Unauthorized", 401) as Response };
    }

    // Fetch the linked Prisma user by Clerk user ID
    const prismaUser = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        email: true,
        role: true,
        coupleAsUser1: { select: { id: true }, take: 1 },
        coupleAsUser2: { select: { id: true }, take: 1 },
      },
    });

    if (!prismaUser) {
      return { context: null, error: apiError("User not found", 404) as Response };
    }

    const coupleId =
      prismaUser.coupleAsUser1[0]?.id || prismaUser.coupleAsUser2[0]?.id || null;

    return {
      context: {
        clerkUserId: userId,
        prismaUserId: prismaUser.id,
        email: prismaUser.email,
        coupleId,
        role: prismaUser.role,
      },
      error: null,
    };
  } catch {
    return { context: null, error: apiError("Unauthorized", 401) as Response };
  }
}

/**
 * requireCouple — like requireAuth but also enforces the user is in a couple.
 */
export async function requireCouple(
  request: NextRequest
): Promise<{ context: AuthContext & { coupleId: string }; error: null } | { context: null; error: Response }> {
  const authResult = await requireAuth(request);
  if (authResult.error) return { context: null, error: authResult.error };

  if (!authResult.context.coupleId) {
    return { context: null, error: apiError("Not in a couple", 400) as Response };
  }

  return {
    context: { ...authResult.context, coupleId: authResult.context.coupleId },
    error: null,
  };
}
