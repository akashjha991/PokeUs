import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  const clearOptions = "HttpOnly; Path=/; SameSite=Lax; Max-Age=0";
  response.headers.append("Set-Cookie", `access_token=; ${clearOptions}`);
  response.headers.append("Set-Cookie", `refresh_token=; ${clearOptions}`);
  return response;
}
