import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/lib/db";
import { signAccessToken, signRefreshToken, generateOTP, getOTPExpiry } from "@/backend/lib/auth";
import { sendOTPEmail } from "@/backend/lib/email";
import { loginSchema } from "@/backend/validations";
import { apiError } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        coupleAsUser1: { include: { user1: true, user2: true }, take: 1 },
        coupleAsUser2: { include: { user1: true, user2: true }, take: 1 },
      },
    });

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return apiError("Invalid email or password", 401);
    }

    // Block login if email not verified — resend OTP and redirect to verify page
    if (!user.isVerified) {
      const otp = generateOTP();
      const otpExpiry = getOTPExpiry();
      await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
      await sendOTPEmail(user.email, user.name, otp, "verify");
      return NextResponse.json({ requiresVerification: true, email: user.email }, { status: 200 });
    }

    const couple = user.coupleAsUser1[0] || user.coupleAsUser2[0] || null;
    const payload = { userId: user.id, email: user.email, coupleId: couple?.id };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken, lastActiveAt: new Date() },
    });

    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

    const response = NextResponse.json({
      user: {
        id: user.id, name: user.name, email: user.email, avatar: user.avatar,
        isVerified: user.isVerified, xpPoints: user.xpPoints, streakDays: user.streakDays,
      },
      couple,
      requiresVerification: false,
    });

    response.headers.append("Set-Cookie", `access_token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=900${secure}`);
    response.headers.append("Set-Cookie", `refresh_token=${refreshToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000${secure}`);

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
