import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { requireAuth } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  const { prismaUserId } = auth.context;

  try {
    const { inviteId } = await request.json();
    if (!inviteId) return apiError("Invite ID is required", 400);

    const user = await prisma.user.findUnique({ where: { id: prismaUserId } });
    if (!user) return apiError("User not found", 404);

    const invite = await prisma.coupleInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) return apiError("Invite not found", 404);
    if (invite.status !== "PENDING") return apiError("Invite is no longer pending", 400);
    if (invite.receiverEmail !== user.email) return apiError("You are not the intended recipient", 403);
    
    await prisma.coupleInvite.update({
      where: { id: inviteId },
      data: { status: "REJECTED" }
    });

    return apiSuccess({ message: "Invitation declined" });
  } catch (error) {
    console.error("Decline invite error:", error);
    return apiError("Something went wrong", 500);
  }
}
