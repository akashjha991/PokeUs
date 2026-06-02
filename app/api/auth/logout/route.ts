import { NextResponse } from "next/server";
import { apiSuccess } from "@/backend/lib/utils";

/**
 * POST /api/auth/logout
 *
 * With Clerk, sign-out is handled entirely client-side via useClerk().signOut().
 * This endpoint exists only for compatibility — it simply returns success.
 * The actual session invalidation happens in Clerk's infrastructure.
 */
export async function POST() {
  return apiSuccess({ message: "Signed out successfully" });
}

export async function GET() {
  return NextResponse.redirect("/login");
}
