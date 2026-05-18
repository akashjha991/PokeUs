import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/lib/db";
import { generateOTP, getOTPExpiry } from "@/backend/lib/auth";
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

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return apiError("Invalid email or password", 401);
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return apiError("Invalid email or password", 401);
    }

    // Generate a fresh OTP for login verification
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await prisma.user.update({
      where: { id: user.id },
      data: { otpCode: otp, otpExpiry },
    });

    await sendOTPEmail(email, user.name, otp, "login");

    return NextResponse.json({
      requiresOtp: true,
      email,
      message: "A verification code has been sent to your email.",
    });
  } catch (error) {
    console.error("Login error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
