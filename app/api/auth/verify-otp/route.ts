import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { otp, email } = body;

    if (!otp || !email) return apiError("OTP and email are required", 400);

    const supabase = await createSupabaseServerClient();

    // Verify OTP natively via Supabase (sets cookies automatically)
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: "signup",
    });

    if (verifyError || !verifyData?.user) {
      console.error("Supabase OTP verification error:", verifyError);
      return apiError(verifyError?.message || "Invalid or expired verification code", 400);
    }

    const supabaseUser = verifyData.user;

    // Fetch or create the linked Prisma user
    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          supabaseId: supabaseUser.id,
          name: supabaseUser.user_metadata?.full_name || email.split("@")[0],
          email,
          isVerified: true,
        },
      });
    } else {
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          isVerified: true,
          supabaseId: supabaseUser.id,
        },
      });
    }

    // Award gamification reward for verifying email if not already awarded
    const existingLog = await prisma.xPLog.findFirst({
      where: { userId: user.id, reason: "Email verified" },
    });
    if (!existingLog) {
      await prisma.xPLog.create({
        data: { userId: user.id, amount: 50, reason: "Email verified" },
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { xpPoints: { increment: 50 } },
      });
    }

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

    const supabase = await createSupabaseServerClient();

    // Resend signup OTP natively using Supabase
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    if (error) {
      console.error("Supabase resend OTP error:", error);
      return apiError(error.message || "Failed to resend verification code", 400);
    }

    return apiSuccess({ message: "A new verification code has been sent to your email." });
  } catch (error) {
    console.error("Resend OTP error:", error);
    return apiError("Something went wrong", 500);
  }
}
