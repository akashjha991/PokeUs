import { NextRequest } from "next/server";
import prisma from "@/backend/lib/db";
import { apiError, apiSuccess } from "@/backend/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("access_token")?.value;
    if (!token) return apiError("Unauthorized", 401);
    
    let payload;
    try {
      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_SECRET);
      const { payload: decoded } = await jwtVerify(token, secret);
      payload = decoded;
    } catch {
      return apiError("Unauthorized", 401);
    }

    const { inviteId } = await request.json();
    if (!inviteId) return apiError("Invite ID is required", 400);

    const user = await prisma.user.findUnique({ where: { id: payload.userId as string } });
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
