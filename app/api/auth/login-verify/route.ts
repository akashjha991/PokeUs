import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { signAccessToken, signRefreshToken, generateOTP, getOTPExpiry } from "@/backend/lib/auth";
import { sendOTPEmail } from "@/backend/lib/email";
import { apiError, apiSuccess } from "@/backend/lib/utils";

// POST /api/auth/login-verify — verify login OTP and issue session cookies
export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json();

    if (!email || !otp) return apiError("Email and OTP are required", 400);

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coupleAsUser1: { include: { user1: true, user2: true }, take: 1 },
        coupleAsUser2: { include: { user1: true, user2: true }, take: 1 },
      },
    });

    if (!user) return apiError("User not found", 404);
    if (user.otpCode !== otp) return apiError("Invalid OTP code", 400);
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return apiError("OTP has expired. Please try logging in again.", 400);
    }

    // Clear the OTP and mark user as verified
    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiry: null, isVerified: true, lastActiveAt: new Date() },
    });

    const couple = user.coupleAsUser1[0] || user.coupleAsUser2[0] || null;
    const payload = { userId: user.id, email: user.email, coupleId: couple?.id };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

    const response = NextResponse.json({
      user: {
        id: user.id, name: user.name, email: user.email, avatar: user.avatar,
        isVerified: true, xpPoints: user.xpPoints, streakDays: user.streakDays,
      },
      couple,
    });

    response.headers.append("Set-Cookie", `access_token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=900${secure}`);
    response.headers.append("Set-Cookie", `refresh_token=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secure}`);

    return response;
  } catch (error) {
    console.error("Login verify error:", error);
    return apiError("Something went wrong", 500);
  }
}

// GET /api/auth/login-verify?email=xxx  → resend login OTP
export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) return apiError("Email is required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("User not found", 404);

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
    await sendOTPEmail(email, user.name, otp, "login");

    return apiSuccess({ message: "A new login code has been sent to your email." });
  } catch (error) {
    console.error("Resend login OTP error:", error);
    return apiError("Something went wrong", 500);
  }
}
