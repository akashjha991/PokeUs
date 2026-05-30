import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import prisma from "@/backend/lib/db";
import { apiError } from "@/backend/lib/utils";

export interface AuthContext {
  supabaseUserId: string;
  prismaUserId: string;
  email: string;
  coupleId: string | null;
  role: string;
}

/**
 * requireAuth — validates the incoming Supabase session from cookies.
 *
 * Returns { context } on success or { error: Response } on failure.
 * Usage in route handlers:
 *
 *   const auth = await requireAuth(request);
 *   if (auth.error) return auth.error;
 *   const { prismaUserId, coupleId } = auth.context;
 */
export async function requireAuth(
  request: NextRequest
): Promise<{ context: AuthContext; error: null } | { context: null; error: Response }> {
  try {
    // Build a minimal Supabase server client that reads cookies from the request
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          // We don't need to set cookies in route handlers (read-only)
          setAll() {},
        },
      }
    );

    // getUser() makes a round-trip to Supabase to validate the JWT — cannot be spoofed
    const {
      data: { user: supabaseUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !supabaseUser) {
      return { context: null, error: apiError("Unauthorized", 401) as Response };
    }

    // Fetch the linked Prisma user
    const prismaUser = await prisma.user.findUnique({
      where: { supabaseId: supabaseUser.id },
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
        supabaseUserId: supabaseUser.id,
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
  const auth = await requireAuth(request);
  if (auth.error) return { context: null, error: auth.error };

  if (!auth.context.coupleId) {
    return { context: null, error: apiError("Not in a couple", 400) as Response };
  }

  return {
    context: { ...auth.context, coupleId: auth.context.coupleId },
    error: null,
  };
}
