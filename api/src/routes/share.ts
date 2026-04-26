import { Router, Request, Response } from "express";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import path from "path";
import prisma from "../lib/prisma";

// Point fontconfig to our config file so canvas finds DejaVu fonts
process.env.FONTCONFIG_FILE = path.resolve(__dirname, "../../fonts.conf");

const router = Router();

// ── LaTeX to readable text ────────────────────────────────────────

function latexToText(expr: string): string {
  return expr
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]*)\}/g, "\u221a($1)")
    .replace(/\\sqrt/g, "\u221a")
    .replace(/\^2/g, "\u00b2")
    .replace(/\^3/g, "\u00b3")
    .replace(/\^\{([^}]+)\}/g, "^($1)")
    .replace(/\_\{([^}]+)\}/g, "_$1")
    .replace(/\\times/g, "\u00d7")
    .replace(/\\div/g, "\u00f7")
    .replace(/\\pm/g, "\u00b1")
    .replace(/\\leq/g, "\u2264")
    .replace(/\\geq/g, "\u2265")
    .replace(/\\neq/g, "\u2260")
    .replace(/\\approx/g, "\u2248")
    .replace(/\\pi/g, "\u03c0")
    .replace(/\\theta/g, "\u03b8")
    .replace(/\\alpha/g, "\u03b1")
    .replace(/\\beta/g, "\u03b2")
    .replace(/\\gamma/g, "\u03b3")
    .replace(/\\infty/g, "\u221e")
    .replace(/\\left/g, "")
    .replace(/\\right/g, "")
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .replace(/\\/g, "")
    .trim();
}

function stripLatex(text: string): string {
  return text
    .replace(/\[SECTION [A-Z]\]/gi, "")
    .replace(/\(section [a-z]\)/gi, "")
    .replace(/section [a-z]\s*:/gi, "")
    .replace(/\$\$([\s\S]*?)\$\$/g, (_, expr) => latexToText(expr))
    .replace(/\$([^$]+?)\$/g, (_, expr) => latexToText(expr))
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]*)\}/g, "\u221a($1)")
    .replace(/\\times/g, "\u00d7")
    .replace(/\\div/g, "\u00f7")
    .replace(/\\geq/g, "\u2265")
    .replace(/\\leq/g, "\u2264")
    .replace(/\\neq/g, "\u2260")
    .replace(/\\pm/g, "\u00b1")
    .replace(/\\pi/g, "\u03c0")
    .replace(/\\theta/g, "\u03b8")
    .replace(/\\alpha/g, "\u03b1")
    .replace(/\\beta/g, "\u03b2")
    .replace(/\\\[|\\\]/g, "")
    .replace(/\\\(|\\\)/g, "")
    .replace(/\^2/g, "\u00b2")
    .replace(/\^3/g, "\u00b3")
    .replace(/\^/g, "^")
    .replace(/\{|\}/g, "")
    .replace(/\\/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function difficultyColor(difficulty: string): string {
  if (difficulty === "easy") return "#43A047";
  if (difficulty === "hard") return "#E53935";
  return "#FB8C00";
}

// ── Canvas drawing helpers ─────────────────────────────────────────

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapTextCanvas(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 5
): number {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const test = currentLine ? currentLine + " " + word : word;
    const metrics = ctx.measureText(test);
    if (metrics.width <= maxWidth) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      if (ctx.measureText(word).width > maxWidth) {
        let truncated = "";
        for (const ch of word) {
          if (ctx.measureText(truncated + ch + "...").width <= maxWidth) {
            truncated += ch;
          } else {
            break;
          }
        }
        currentLine = truncated + "...";
      } else {
        currentLine = word;
      }
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && displayLines.length > 0) {
    const last = displayLines[displayLines.length - 1];
    displayLines[displayLines.length - 1] = last.slice(0, -3) + "...";
  }

  displayLines.forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });

  return displayLines.length;
}

// ── Main share route ───────────────────────────────────────────────

router.get("/:questionId", async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: String(req.params.questionId) },
      include: {
        topic: { select: { name: true, icon: true } },
        paper: { select: { title: true } },
      },
    });

    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }

    const cleanText = stripLatex(question.questionText);
    const topicName = (question.topic?.name || "Mathematics").replace(
      /[^\x00-\x7F]/g,
      ""
    );
    const difficulty = question.difficulty;
    const marks = question.marks;
    const diffColor = difficultyColor(difficulty);

    // ── Create canvas ──────────────────────────────────────────
    const W = 1200;
    const H = 630;
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, "#1565C0");
    bgGrad.addColorStop(1, "#0D47A1");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.fillStyle = "rgba(25, 118, 210, 0.25)";
    ctx.beginPath();
    ctx.arc(1100, 80, 180, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(25, 118, 210, 0.2)";
    ctx.beginPath();
    ctx.arc(80, 560, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(33, 150, 243, 0.15)";
    ctx.beginPath();
    ctx.arc(1150, 570, 90, 0, Math.PI * 2);
    ctx.fill();

    // Top accent line
    ctx.fillStyle = "#42A5F5";
    ctx.fillRect(0, 0, W, 6);

    // White card background
    const cardGrad = ctx.createLinearGradient(0, 55, 0, 510);
    cardGrad.addColorStop(0, "#ffffff");
    cardGrad.addColorStop(1, "#E3F2FD");
    ctx.fillStyle = cardGrad;
    drawRoundedRect(ctx, 55, 55, 1090, 455, 20);
    ctx.fill();

    // Left accent bar
    ctx.fillStyle = "#1976D2";
    drawRoundedRect(ctx, 55, 55, 7, 455, 4);
    ctx.fill();

    // ── Badges ─────────────────────────────────────────────────

    // Topic badge
    ctx.font = "bold 19px 'DejaVu Sans', sans-serif";
    const topicTextW = ctx.measureText(topicName).width;
    const topicBadgeW = topicTextW + 50;
    ctx.fillStyle = "#1976D2";
    drawRoundedRect(ctx, 90, 88, topicBadgeW, 40, 20);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.fillText(topicName, 110, 114);

    // Difficulty badge
    const diffBadgeX = 90 + topicBadgeW + 20;
    ctx.fillStyle = diffColor + "26";
    drawRoundedRect(ctx, diffBadgeX, 88, 120, 40, 20);
    ctx.fill();
    ctx.font = "bold 17px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = diffColor;
    ctx.textAlign = "center";
    ctx.fillText(difficulty.toUpperCase(), diffBadgeX + 60, 114);
    ctx.textAlign = "left";

    // Marks badge
    const marksBadgeX = diffBadgeX + 140;
    ctx.fillStyle = "#E3F2FD";
    drawRoundedRect(ctx, marksBadgeX, 88, 120, 40, 20);
    ctx.fill();
    ctx.font = "bold 17px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#1565C0";
    ctx.textAlign = "center";
    ctx.fillText(
      `${marks} mark${marks !== 1 ? "s" : ""}`,
      marksBadgeX + 60,
      114
    );
    ctx.textAlign = "left";

    // Separator line
    ctx.strokeStyle = "rgba(25, 118, 210, 0.2)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(90, 148);
    ctx.lineTo(1110, 148);
    ctx.stroke();

    // ── Question text ──────────────────────────────────────────
    ctx.font = "34px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#1a1a2e";
    wrapTextCanvas(ctx, cleanText, 90, 200, 1020, 46, 5);

    // ── Footer ─────────────────────────────────────────────────
    // Bottom accent line on card
    ctx.fillStyle = "#42A5F5";
    ctx.fillRect(55, 510, 1090, 4);

    // Footer background
    ctx.fillStyle = "#0D47A1";
    ctx.fillRect(55, 514, 1090, 96);

    // Footer bottom rounded accent
    ctx.fillStyle = "#0D47A1";
    drawRoundedRect(ctx, 55, 606, 1090, 4, 4);
    ctx.fill();

    // Logo: ZIM MATHS .com — properly spaced
    ctx.font = "bold 34px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "white";
    ctx.fillText("ZIM", 100, 562);
    ctx.fillStyle = "#64B5F6";
    ctx.fillText("MATHS", 168, 562);
    ctx.font = "15px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#90CAF9";
    ctx.fillText(".com", 300, 555);

    // Vertical separator
    ctx.strokeStyle = "rgba(66, 165, 245, 0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(340, 528);
    ctx.lineTo(340, 604);
    ctx.stroke();

    // Tagline — two lines
    ctx.font = "18px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#BBDEFB";
    ctx.fillText("Zimbabwe's #1 Maths Platform", 370, 554);
    ctx.font = "15px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#90CAF9";
    ctx.fillText("Practice - Learn - Excel", 370, 582);

    // Visit site button
    ctx.fillStyle = "#2196F3";
    drawRoundedRect(ctx, 930, 530, 195, 54, 27);
    ctx.fill();
    ctx.font = "bold 18px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText("Visit Site", 1027, 557);
    ctx.font = "13px 'DejaVu Sans', sans-serif";
    ctx.fillStyle = "#BBDEFB";
    ctx.fillText("zimmaths.com", 1027, 576);
    ctx.textAlign = "left";

    // ── Output ─────────────────────────────────────────────────
    const pngBuffer = canvas.toBuffer("image/png");

    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(pngBuffer);
  } catch (error) {
    console.error("Share card error:", error);
    res.status(500).json({ error: "Failed to generate share card" });
  }
});

export default router;