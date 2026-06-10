import { NextRequest } from "next/server";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { generateWeeklyWrapped } from "@/backend/services/wrapped";

export async function GET(request: NextRequest) {
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  try {
    const wrappedResult = await generateWeeklyWrapped(coupleId, prismaUserId);
    return apiSuccess(wrappedResult);
  } catch (error) {
    console.error("[api/wrapped] GET error:", error);
    return apiError(
      `Failed to generate wrapped: ${error instanceof Error ? error.message : "unknown"}`,
      500
    );
  }
}
