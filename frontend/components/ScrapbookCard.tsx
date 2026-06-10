"use client";

import { useEffect, useRef } from "react";
import { Download, Share2 } from "lucide-react";
import { toast } from "sonner";

interface ScrapbookCardProps {
  userName: string;
  userAvatar?: string | null;
  partnerName: string;
  partnerAvatar?: string | null;
  weekRange: string;
  score: number;
  headline: string;
  highlights: string[];
}

// ── Helpers ────────────────────────────────────────────────────────────────

async function loadGoogleFont(name: string, url: string) {
  try {
    const face = new FontFace(name, `url(${url})`);
    await face.load();
    document.fonts.add(face);
  } catch {}
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    // Add Cloudinary transformation for CORS-safe access if needed
    img.src = src;
  });
}

function rrect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, color: string, alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy + size * 0.35);
  ctx.bezierCurveTo(cx, cy, cx - size, cy, cx - size, cy + size * 0.35);
  ctx.bezierCurveTo(cx - size, cy + size * 0.7, cx, cy + size, cx, cy + size);
  ctx.bezierCurveTo(cx, cy + size, cx + size, cy + size * 0.7, cx + size, cy + size * 0.35);
  ctx.bezierCurveTo(cx + size, cy, cx, cy, cx, cy + size * 0.35);
  ctx.fill();
  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number, size: number, color: string, alpha = 1
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const outerA = (i * 4 * Math.PI) / 5 - Math.PI / 2;
    const innerA = ((i * 4 + 2) * Math.PI) / 5 - Math.PI / 2;
    const ox = cx + size * Math.cos(outerA);
    const oy = cy + size * Math.sin(outerA);
    const ix = cx + (size * 0.42) * Math.cos(innerA);
    const iy = cy + (size * 0.42) * Math.sin(innerA);
    if (i === 0) ctx.moveTo(ox, oy); else ctx.lineTo(ox, oy);
    ctx.lineTo(ix, iy);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string, x: number, y: number, maxW: number, lineH: number
): number {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, curY);
      line = word + " ";
      curY += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, curY);
  return curY;
}

function clampText(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (ctx.measureText(t + "…").width > maxW && t.length > 0) t = t.slice(0, -1);
  return t + "…";
}

// ── Main draw function ─────────────────────────────────────────────────────

async function drawScrapbook(
  canvas: HTMLCanvasElement,
  props: ScrapbookCardProps
) {
  const { userName, userAvatar, partnerName, partnerAvatar, weekRange, score, headline, highlights } = props;

  // Load font first
  await loadGoogleFont(
    "Caveat",
    "https://fonts.gstatic.com/s/caveat/v18/WnznHAc5bAfYB2Q7ZjYYiAzcPDWf.woff2"
  );

  const W = 400;
  const H = 660;
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;

  // ── Background paper ───────────────────────────────────────────────────
  ctx.fillStyle = "#FFF9EE";
  ctx.fillRect(0, 0, W, H);

  // Subtle ruled lines
  ctx.strokeStyle = "rgba(186,160,120,0.12)";
  ctx.lineWidth = 1;
  for (let y = 28; y < H; y += 24) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Faint left margin line
  ctx.strokeStyle = "rgba(230,150,150,0.18)";
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(38, 0); ctx.lineTo(38, H); ctx.stroke();

  // ── Decorative hearts (bg layer) ───────────────────────────────────────
  drawHeart(ctx, 18, 14, 7,  "#f472b6", 0.25);
  drawHeart(ctx, 370, 38, 5, "#f472b6", 0.2);
  drawHeart(ctx, 12, 560, 9, "#e11d48", 0.2);
  drawHeart(ctx, 376, 490, 6, "#f472b6", 0.2);
  drawHeart(ctx, 190, 640, 8, "#f472b6", 0.15);

  // Stars
  drawStar(ctx, 370, 100, 8, "#fbbf24", 0.45);
  drawStar(ctx, 20, 120, 6, "#fbbf24", 0.35);
  drawStar(ctx, 385, 310, 7, "#fbbf24", 0.4);
  drawStar(ctx, 12, 400, 5, "#fbbf24", 0.3);
  drawStar(ctx, 390, 560, 6, "#fbbf24", 0.3);

  // ── Title block ────────────────────────────────────────────────────────
  ctx.textAlign = "center";
  ctx.fillStyle = "#6d28d9";
  ctx.font = "bold 30px Caveat, cursive";
  ctx.fillText("✨ Our Week Wrapped ✨", W / 2, 48);

  ctx.font = "17px Caveat, cursive";
  ctx.fillStyle = "#9ca3af";
  ctx.fillText(weekRange, W / 2, 70);

  // ── Washi tape strips ─────────────────────────────────────────────────
  const tapes = [
    { cx: 104, cy: 115, angle: -0.12, color: "rgba(251,191,36,0.55)", w: 70, h: 17 },
    { cx: 296, cy: 115, angle: 0.1,  color: "rgba(244,114,182,0.5)", w: 70, h: 17 },
  ];
  tapes.forEach(({ cx, cy, angle, color, w, h }) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    // Scalloped washi tape appearance
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.restore();
  });

  // ── Load profile images ────────────────────────────────────────────────
  let userImg: HTMLImageElement | null = null;
  let partnerImg: HTMLImageElement | null = null;
  try { if (userAvatar) userImg = await loadImage(userAvatar); } catch {}
  try { if (partnerAvatar) partnerImg = await loadImage(partnerAvatar); } catch {}

  // ── Draw polaroid helper ───────────────────────────────────────────────
  function drawPolaroid(
    tx: number, ty: number, angle: number,
    img: HTMLImageElement | null, label: string, fallbackColor: string
  ) {
    ctx.save();
    ctx.translate(tx, ty);
    ctx.rotate(angle);

    // Drop shadow
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;

    // White polaroid body
    ctx.fillStyle = "#ffffff";
    rrect(ctx, -60, -70, 120, 148, 5);
    ctx.fill();
    ctx.shadowColor = "transparent";

    // Photo area (slightly warm tint)
    ctx.save();
    rrect(ctx, -52, -62, 104, 104, 3);
    ctx.clip();
    if (img) {
      // Cover-fit the image
      const s = Math.max(104 / img.width, 104 / img.height);
      const dw = img.width * s;
      const dh = img.height * s;
      ctx.drawImage(img, -52 + (104 - dw) / 2, -62 + (104 - dh) / 2, dw, dh);
    } else {
      // Placeholder
      const grad = ctx.createLinearGradient(-52, -62, 52, 42);
      grad.addColorStop(0, fallbackColor);
      grad.addColorStop(1, "#ffffff");
      ctx.fillStyle = grad;
      ctx.fillRect(-52, -62, 104, 104);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 38px Caveat, cursive";
      ctx.textAlign = "center";
      ctx.fillText(label.charAt(0).toUpperCase(), 0, 14);
    }
    ctx.restore();

    // Name label under photo
    ctx.fillStyle = "#374151";
    ctx.font = "bold 16px Caveat, cursive";
    ctx.textAlign = "center";
    ctx.fillText(label.split(" ")[0], 0, 66);

    ctx.restore();
  }

  drawPolaroid(108, 195, -0.12, userImg, userName, "#c4b5fd");
  drawPolaroid(292, 195, 0.11,  partnerImg, partnerName, "#fda4af");

  // Heart between polaroids
  ctx.save();
  ctx.font = "30px serif";
  ctx.textAlign = "center";
  ctx.fillText("❤️", W / 2, 200);
  ctx.restore();

  // ── Score pill ────────────────────────────────────────────────────────
  const scoreGrad = ctx.createLinearGradient(70, 310, 330, 340);
  scoreGrad.addColorStop(0, "#7c3aed");
  scoreGrad.addColorStop(1, "#ec4899");
  ctx.fillStyle = scoreGrad;
  ctx.shadowColor = "rgba(124,58,237,0.35)";
  ctx.shadowBlur = 12;
  rrect(ctx, 70, 310, 260, 52, 26);
  ctx.fill();
  ctx.shadowColor = "transparent";

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px Caveat, cursive";
  ctx.textAlign = "center";
  ctx.fillText(`💜  Love Score: ${score} / 100`, W / 2, 343);

  // ── Headline ──────────────────────────────────────────────────────────
  ctx.fillStyle = "#1f2937";
  ctx.font = "bold 19px Caveat, cursive";
  ctx.textAlign = "center";
  const headlineEndY = wrapText(ctx, headline, W / 2, 386, 330, 24);

  // ── Highlights ────────────────────────────────────────────────────────
  const hlColors = ["#ec4899", "#7c3aed", "#10b981"];
  const hlBg     = ["rgba(236,72,153,0.08)", "rgba(124,58,237,0.08)", "rgba(16,185,129,0.08)"];
  let hlY = headlineEndY + 22;

  highlights.slice(0, 3).forEach((h, i) => {
    ctx.font = "15px Caveat, cursive";
    const clamped = clampText(ctx, h, 290);

    // Soft bg pill
    ctx.fillStyle = hlBg[i];
    rrect(ctx, 28, hlY - 16, W - 56, 26, 8);
    ctx.fill();

    ctx.fillStyle = hlColors[i];
    ctx.textAlign = "left";
    ctx.fillText(`• ${clamped}`, 42, hlY + 4);
    hlY += 34;
  });

  // ── Scattered emoji doodles ───────────────────────────────────────────
  const doodles: { e: string; x: number; y: number; size?: number }[] = [
    { e: "🌸", x: 22,  y: hlY + 10,   size: 16 },
    { e: "⭐", x: 374, y: hlY + 10,   size: 16 },
    { e: "🍬", x: 22,  y: hlY + 50,   size: 14 },
    { e: "☁️", x: 374, y: hlY + 50,   size: 14 },
    { e: "✨", x: 374, y: 172,          size: 16 },
    { e: "🌙", x: 22,  y: 290,         size: 14 },
    { e: "😊", x: 22,  y: 170,         size: 14 },
  ];
  doodles.forEach(({ e, x, y, size = 16 }) => {
    ctx.font = `${size}px serif`;
    ctx.textAlign = "center";
    ctx.fillText(e, x, y);
  });

  // ── Footer ────────────────────────────────────────────────────────────
  ctx.strokeStyle = "rgba(186,160,120,0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(28, H - 36); ctx.lineTo(W - 28, H - 36);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = "#9ca3af";
  ctx.font = "14px Caveat, cursive";
  ctx.textAlign = "center";
  ctx.fillText("Made with PokeUs 💜", W / 2, H - 14);
}

// ── Component ──────────────────────────────────────────────────────────────

export function ScrapbookCard(props: ScrapbookCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawScrapbook(canvas, props);
  }, [props.userName, props.userAvatar, props.partnerName, props.partnerAvatar, props.score, props.headline]);

  function handleDownload() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = "couple-wrapped.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success("Saved to downloads 📸");
  }

  function handleShare() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "couple-wrapped.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: "Our Week Wrapped 💜" });
        } catch {}
      } else {
        handleDownload();
      }
    }, "image/png");
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <canvas
        ref={canvasRef}
        style={{
          borderRadius: 24,
          maxWidth: "100%",
          boxShadow: "0 20px 60px rgba(124,58,237,0.25), 0 4px 20px rgba(0,0,0,0.2)",
        }}
      />
      <div className="flex gap-3 w-full">
        <button
          onClick={handleShare}
          className="flex-1 py-3.5 rounded-2xl font-bold text-white flex items-center justify-center gap-2 transition-all active:scale-95"
          style={{ background: "linear-gradient(135deg, #d946ef, #e11d48)" }}
        >
          <Share2 size={16} />
          Share Card
        </button>
        <button
          onClick={handleDownload}
          className="py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 font-semibold transition-all active:scale-95"
          style={{ background: "rgb(var(--surface-muted))", color: "rgb(var(--text-muted))" }}
        >
          <Download size={16} />
        </button>
      </div>
    </div>
  );
}
