import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/lib/db";
import { generateOTP, getOTPExpiry } from "@/backend/lib/auth";
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
      // If user exists but is not verified, resend OTP instead of erroring
      if (!existing.isVerified) {
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();
        await prisma.user.update({
          where: { id: existing.id },
          data: { otpCode: otp, otpExpiry },
        });
        await sendOTPEmail(email, existing.name, otp, "verify");
        return apiSuccess({ message: "Verification code resent.", email, requiresVerification: true }, 200);
      }
      return apiError("An account with this email already exists", 409);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate OTP before creating user
    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    // Create user as UNVERIFIED with OTP
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        otpCode: otp,
        otpExpiry,
      },
    });

    // Send OTP verification email
    await sendOTPEmail(email, name, otp, "verify");

    return apiSuccess({
      message: "Account created! Please check your email for the verification code.",
      email,
      requiresVerification: true,
    }, 201);
  } catch (error) {
    console.error("Register error:", error);
    return apiError("Something went wrong. Please try again.", 500);
  }
}
