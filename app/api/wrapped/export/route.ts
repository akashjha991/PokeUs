import { NextRequest } from "next/server";
import { requireCouple } from "@/backend/lib/requireAuth";
import { apiError, apiSuccess } from "@/backend/lib/utils";
import { generateWeeklyWrapped } from "@/backend/services/wrapped";
import { uploadImage } from "@/backend/lib/cloudinary";

export async function POST(request: NextRequest) {
  // Set custom local browser path so Playwright resolves the binary correctly on Render runtime
  process.env.PLAYWRIGHT_BROWSERS_PATH = "./.playwright-browsers";

  // Dynamically import playwright to guarantee it reads the modified env path during load
  const { chromium } = await import("playwright");

  // 1. Auth check
  const auth = await requireCouple(request);
  if (auth.error) return auth.error;
  const { coupleId, prismaUserId } = auth.context;

  try {
    // 2. Parse request body
    const body = await request.json().catch(() => ({}));
    const theme = body.theme || "storybook";

    // 3. Generate wrapped stats and AI summary
    const wrappedResult = await generateWeeklyWrapped(coupleId, prismaUserId);

    // 4. Base64-encode data for the render URL
    const payload = Buffer.from(JSON.stringify(wrappedResult)).toString("base64");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const renderUrl = `${appUrl}/wrapped/render?theme=${theme}&data=${payload}`;

    console.log(`[wrapped/export] Launching browser to screenshot: ${renderUrl}`);

    // 5. Spin up Playwright Chromium
    const browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    
    // Set viewport to the requested 1080x1920 resolution
    await page.setViewportSize({ width: 1080, height: 1920 });

    // Navigate to render URL
    await page.goto(renderUrl, {
      waitUntil: "networkidle",
      timeout: 30000,
    });

    // Wait a short duration (2000ms) for fonts and Framer Motion animations to finish
    await page.waitForTimeout(2000);

    // Take screenshot of the specific card element or the entire page viewport
    const screenshotBuffer = await page.screenshot({
      type: "png",
      fullPage: true,
    });

    await browser.close();

    console.log("[wrapped/export] Screenshot captured. Uploading to Cloudinary...");

    // 6. Upload buffer to Cloudinary
    const uploadResult = await uploadImage(
      screenshotBuffer,
      "pokeus_wrapped",
      "image"
    );

    console.log("[wrapped/export] Upload successful:", uploadResult.url);

    // Return the secure URL
    return apiSuccess({
      url: uploadResult.url,
      theme,
    });
  } catch (error) {
    console.error("[api/wrapped/export] POST error:", error);
    return apiError(
      `Failed to export wrapped card: ${error instanceof Error ? error.message : "unknown"}`,
      500
    );
  }
}
