import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/invite(.*)",
  "/privacy(.*)",
  "/api/auth/clerk-webhook(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // API routes handle their own auth via requireAuth()
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  if (!isPublicRoute(request)) {
    // Protect all non-public routes — redirect unauthenticated users to sign-in
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|icons).*)",
  ],
};
