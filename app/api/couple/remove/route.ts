import { NextRequest, NextResponse } from "next/server";
import prisma from "@/backend/lib/db";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;

  const { coupleId } = auth.context;

  try {
    // Delete the couple connection
    await prisma.couple.deleteMany({
      where: {
        id: coupleId,
      },
    });

    return NextResponse.json({ success: true, message: "Connection removed successfully" });
  } catch (error) {
    console.error("Remove connection error:", error);
    return apiError("Something went wrong while removing connection", 500);
  }
}
