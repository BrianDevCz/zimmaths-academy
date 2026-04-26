import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Strip LaTeX and section labels for display
function stripLatex(text: string): string {
  return text
    .replace(/\[SECTION [A-Z]\]/gi, "")
    .replace(/\(section [a-z]\)/gi, "")
    .replace(/section [a-z]\s*:/gi, "")
    .replace(/\$\$[\s\S]*?\$\$/g, "")
    .replace(/\$[^$]*?\$/g, "")
    .replace(/\\frac\{([^}]*)\}\{([^}]*)\}/g, "$1/$2")
    .replace(/\\sqrt\{([^}]*)\}/g, "√($1)")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\geq/g, "≥")
    .replace(/\\leq/g, "≤")
    .replace(/\\neq/g, "≠")
    .replace(/\\pm/g, "±")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\\[|\\\]/g, "")
    .replace(/\\\(|\\\)/g, "")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
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

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Wrap text into SVG tspan elements — max 5 lines
function wrapText(
  text: string, x: number, y: number,
  maxWidth: number, fontSize: number, color: string,
  maxLines = 5
): string {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.58));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const test = currentLine ? currentLine + " " + word : word;
    if (test.length <= charsPerLine) {
      currentLine = test;
    } else {
      if (currentLine) lines.push(currentLine);
      // If single word is too long, truncate it
      currentLine = word.length > charsPerLine ? word.slice(0, charsPerLine - 3) + "..." : word;
    }
  }
  if (currentLine) lines.push(currentLine);

  const displayLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    displayLines[maxLines - 1] = displayLines[maxLines - 1].slice(0, -3) + "...";
  }

  return displayLines
    .map((line, i) =>
      `<text x="${x}" y="${y + i * (fontSize + 12)}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" fill="${color}">${escapeXml(line)}</text>`
    )
    .join("\n  ");
}

// GET /api/share/:questionId — generate SVG share card
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
    const topicName = question.topic?.name || "Mathematics";
    const topicIcon = question.topic?.icon || "📐";
    const difficulty = question.difficulty;
    const marks = question.marks;
    const diffColor = difficultyColor(difficulty);

    // Topic badge width
    const topicBadgeW = topicName.length * 12 + 70;
    const diffBadgeX = topicBadgeW + 120;
    const marksBadgeX = diffBadgeX + 130;

    const svg = `<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1565C0"/>
      <stop offset="100%" style="stop-color:#0D47A1"/>
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#E3F2FD"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)"/>

  <!-- Decorative circles -->
  <circle cx="1100" cy="80" r="180" fill="#1976D2" opacity="0.25"/>
  <circle cx="80" cy="560" r="130" fill="#1976D2" opacity="0.2"/>
  <circle cx="1150" cy="570" r="90" fill="#2196F3" opacity="0.15"/>

  <!-- Top accent bar -->
  <rect x="0" y="0" width="1200" height="6" fill="#42A5F5"/>

  <!-- Main card -->
  <rect x="55" y="55" width="1090" height="455" rx="20" fill="url(#card)"/>
  <rect x="55" y="55" width="7" height="455" rx="4" fill="#1976D2"/>

  <!-- Topic badge -->
  <rect x="90" y="88" width="${topicBadgeW}" height="40" rx="20" fill="#1976D2"/>
  <text x="120" y="114" font-family="Arial, Helvetica, sans-serif" font-size="19" font-weight="bold" fill="white">${escapeXml(topicIcon)} ${escapeXml(topicName)}</text>

  <!-- Difficulty badge -->
  <rect x="${diffBadgeX}" y="88" width="120" height="40" rx="20" fill="${diffColor}" opacity="0.15"/>
  <text x="${diffBadgeX + 60}" y="114" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="${diffColor}" text-anchor="middle" dominant-baseline="middle">${difficulty.toUpperCase()}</text>

  <!-- Marks badge -->
  <rect x="${marksBadgeX}" y="88" width="120" height="40" rx="20" fill="#E3F2FD"/>
  <text x="${marksBadgeX + 60}" y="114" font-family="Arial, Helvetica, sans-serif" font-size="17" font-weight="bold" fill="#1565C0" text-anchor="middle" dominant-baseline="middle">${marks} mark${marks !== 1 ? "s" : ""}</text>

  <!-- Divider -->
  <line x1="90" y1="148" x2="1110" y2="148" stroke="#1976D2" stroke-width="1.5" opacity="0.2"/>

  <!-- Question text -->
  ${wrapText(cleanText, 90, 190, 1020, 34, "#1a1a2e", 5)}

  <!-- Bottom branding bar -->
  <rect x="55" y="510" width="1090" height="4" fill="#42A5F5"/>
  <rect x="55" y="514" width="1090" height="96" rx="0" fill="#0D47A1"/>
  <rect x="55" y="606" width="1090" height="4" rx="4" fill="#0D47A1"/>

  <!-- Logo -->
  <text x="100" y="562" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="white">ZIM</text>
  <text x="163" y="562" font-family="Arial, Helvetica, sans-serif" font-size="34" font-weight="bold" fill="#64B5F6">MATHS</text>
  <text x="100" y="590" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#90CAF9">.com</text>

  <!-- Divider -->
  <line x1="270" y1="528" x2="270" y2="604" stroke="#42A5F5" stroke-width="1" opacity="0.4"/>

  <!-- Tagline -->
  <text x="300" y="558" font-family="Arial, Helvetica, sans-serif" font-size="20" fill="#BBDEFB">Zimbabwe's #1 ZIMSEC O-Level Maths Platform</text>
  <text x="300" y="590" font-family="Arial, Helvetica, sans-serif" font-size="17" fill="#90CAF9">Practice • Learn • Excel 🇿🇼</text>

  <!-- CTA button -->
  <rect x="930" y="530" width="195" height="54" rx="27" fill="#2196F3"/>
  <text x="1027" y="557" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Visit Site →</text>
  <text x="1027" y="576" font-family="Arial, Helvetica, sans-serif" font-size="13" fill="#BBDEFB" text-anchor="middle">zimmaths.com</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "no-cache"); // disable cache during testing
    res.send(svg);
  } catch (error) {
    console.error("Share card error:", error);
    res.status(500).json({ error: "Failed to generate share card" });
  }
});

export default router;
