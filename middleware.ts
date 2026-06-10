import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Routes accessible without authentication
const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/signup(.*)",
  "/invite(.*)",
  "/privacy(.*)",
  "/wrapped/render(.*)",
  "/api/auth/clerk-webhook(.*)",
]);

export default clerkMiddleware(async (auth, request) => {
  // API routes handle their own auth via requireAuth()
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // If the user is signed in and visiting the landing page, redirect to the app
  if (userId && request.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If the user is signed in and visiting login/signup, redirect to the app
  if (userId && (request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/signup"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
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
