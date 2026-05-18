import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/lib/db";
import { signAccessToken, signRefreshToken, generateOTP, getOTPExpiry } from "@/backend/lib/auth";
import { sendOTPEmail } from "@/backend/lib/email";
import { signupSchema } from "@/backend/validations";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return apiError(parsed.error.errors[0].message, 400);
    }

    const { name, email, password } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return apiError("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword, otpCode: otp, otpExpiry },
    });

    await sendOTPEmail(email, name, otp, "verify");

    const accessToken = signAccessToken({ userId: user.id, email: user.email });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email });

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    const response = apiSuccess({
      message: "Account created! Please verify your email.",
      email,
      requiresVerification: true,
    }, 201);

    response.headers.set(
      "Set-Cookie",
      `access_token=${accessToken}; HttpOnly; Path=/; SameSite=Lax; Max-Age=900`
    );

    return response;
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
