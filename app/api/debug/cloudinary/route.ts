import { NextResponse } from "next/server";
import { cloudinary } from "@/backend/lib/cloudinary";

// GET /api/debug/cloudinary — test Cloudinary config (remove before production)
export async function GET() {
  try {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const hasSecret = !!process.env.CLOUDINARY_API_SECRET;

    // Ping Cloudinary to verify credentials
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.api.ping((error: any, result: any) => {
        if (error) reject(error);
        else resolve(result);
      });
    });

    return NextResponse.json({
      ok: true,
      cloudName,
      apiKey,
      hasSecret,
      pingResult: result,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      error: err?.message || String(err),
      http_code: err?.http_code,
    }, { status: 500 });
  }
}
