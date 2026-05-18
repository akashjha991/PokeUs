import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/backend/lib/db";
import { resetPasswordSchema } from "@/backend/validations";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resetPasswordSchema.safeParse(body);
    if (!parsed.success) return apiError(parsed.error.errors[0].message, 400);

    const { email, otp, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return apiError("User not found", 404);
    if (user.otpCode !== otp) return apiError("Invalid OTP code", 400);
    if (!user.otpExpiry || user.otpExpiry < new Date()) return apiError("OTP has expired", 400);

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashed, otpCode: null, otpExpiry: null },
    });

    return apiSuccess({ message: "Password reset successfully. Please login." });
  } catch (error) {
    console.error("Reset password error:", error);
    return apiError("Something went wrong", 500);
  }
}
