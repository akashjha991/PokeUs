import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { generateOTP, getOTPExpiry } from "@/backend/lib/auth";
import { sendOTPEmail } from "@/backend/lib/email";
import { forgotPasswordSchema } from "@/backend/validations";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { email } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return apiSuccess({ message: "If this email exists, you'll receive a reset code shortly." });
    }

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();
    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
    await sendOTPEmail(email, user.name, otp, "reset");

    return apiSuccess({ message: "If this email exists, you'll receive a reset code shortly." });
  } catch (error) {
    console.error("Forgot password error:", error);
    return apiError("Something went wrong", 500);
  }
}
