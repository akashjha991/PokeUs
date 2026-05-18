import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { generateOTP, getOTPExpiry } from "@/backend/lib/auth";
import { sendOTPEmail } from "@/backend/lib/email";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, email } = body;

    if (!otp || !email) return apiError("OTP and email are required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("User not found", 404);
    if (user.otpCode !== otp) return apiError("Invalid OTP code", 400);
    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      return apiError("OTP has expired. Please request a new one.", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, otpCode: null, otpExpiry: null },
    });

    await prisma.xPLog.create({ data: { userId: user.id, amount: 50, reason: "Email verified" } });
    await prisma.user.update({ where: { id: user.id }, data: { xpPoints: { increment: 50 } } });

    return apiSuccess({ message: "Email verified successfully!" });
  } catch (error) {
    console.error("OTP verify error:", error);
    return apiError("Something went wrong", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) return apiError("Email is required", 400);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("User not found", 404);
    if (user.isVerified) return apiError("Email is already verified", 400);

    const otp = generateOTP();
    const otpExpiry = getOTPExpiry();

    await prisma.user.update({ where: { id: user.id }, data: { otpCode: otp, otpExpiry } });
    await sendOTPEmail(email, user.name, otp, "verify");

    return apiSuccess({ message: "A new OTP has been sent to your email." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return apiError("Something went wrong", 500);
  }
}
