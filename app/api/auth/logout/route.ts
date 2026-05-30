import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/backend/lib/supabase-server";

export async function POST() {
  try {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();

    // Return response — @supabase/ssr automatically clears session cookies
    return NextResponse.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ message: "Logged out successfully" });
  }
}
