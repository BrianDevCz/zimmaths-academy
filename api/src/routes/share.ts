import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Strip LaTeX for display
function stripLatex(text: string): string {
  return text
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

// Difficulty color
function difficultyColor(difficulty: string): string {
  if (difficulty === "easy") return "#43A047";
  if (difficulty === "hard") return "#E53935";
  return "#FB8C00";
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
    const truncated = cleanText.length > 180
      ? cleanText.slice(0, 180) + "..."
      : cleanText;

    const topicName = question.topic?.name || "Mathematics";
    const topicIcon = question.topic?.icon || "📐";
    const difficulty = question.difficulty;
    const marks = question.marks;
    const diffColor = difficultyColor(difficulty);

    // Build SVG card — 1200x630 (standard OG image size)
    const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1565C0;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0D47A1;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="card" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#E3F2FD;stop-opacity:1" />
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bg)" />

  <!-- Decorative circles -->
  <circle cx="1100" cy="80" r="180" fill="#1976D2" opacity="0.3"/>
  <circle cx="100" cy="550" r="140" fill="#1976D2" opacity="0.2"/>
  <circle cx="1150" cy="580" r="100" fill="#2196F3" opacity="0.15"/>

  <!-- Top bar accent -->
  <rect x="0" y="0" width="1200" height="6" fill="#42A5F5"/>

  <!-- Main card -->
  <rect x="60" y="60" width="1080" height="440" rx="24" fill="url(#card)" />

  <!-- Card left accent bar -->
  <rect x="60" y="60" width="8" height="440" rx="4" fill="#1976D2"/>

  <!-- Topic badge -->
  <rect x="100" y="95" width="${topicName.length * 11 + 60}" height="38" rx="19" fill="#1976D2"/>
  <text x="130" y="120" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white">${topicIcon} ${topicName}</text>

  <!-- Difficulty badge -->
  <rect x="${100 + topicName.length * 11 + 75}" y="95" width="100" height="38" rx="19" fill="${diffColor}" opacity="0.15"/>
  <text x="${100 + topicName.length * 11 + 125}" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="${diffColor}" text-anchor="middle" dominant-baseline="middle">${difficulty.toUpperCase()}</text>

  <!-- Marks badge -->
  <rect x="${100 + topicName.length * 11 + 190}" y="95" width="110" height="38" rx="19" fill="#E3F2FD"/>
  <text x="${100 + topicName.length * 11 + 245}" y="120" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#1565C0" text-anchor="middle" dominant-baseline="middle">${marks} mark${marks !== 1 ? "s" : ""}</text>

  <!-- "Can you solve this?" label -->
  <text x="100" y="175" font-family="Arial, sans-serif" font-size="22" font-weight="bold" fill="#1565C0" opacity="0.7">Can you solve this ZIMSEC question?</text>

  <!-- Divider -->
  <line x1="100" y1="192" x2="1100" y2="192" stroke="#1976D2" stroke-width="1.5" opacity="0.2"/>

  <!-- Question text - wrapped into multiple lines -->
  ${wrapText(truncated, 100, 240, 1000, 32, "#1a1a2e")}

  <!-- Bottom section -->
  <rect x="60" y="500" width="1080" height="130" rx="0" fill="#0D47A1" opacity="0.0"/>

  <!-- ZimMaths branding -->
  <rect x="60" y="510" width="1080" height="120" rx="0" fill="#0D47A1" opacity="0.9"/>
  <rect x="60" y="510" width="1080" height="3" fill="#42A5F5"/>

  <!-- Logo text -->
  <text x="110" y="568" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="white">ZIM</text>
  <text x="163" y="568" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#64B5F6">MATHS</text>
  <text x="110" y="595" font-family="Arial, sans-serif" font-size="18" fill="#90CAF9">.com</text>

  <!-- Divider -->
  <line x1="260" y1="530" x2="260" y2="615" stroke="#42A5F5" stroke-width="1" opacity="0.4"/>

  <!-- Tagline -->
  <text x="290" y="562" font-family="Arial, sans-serif" font-size="20" fill="#BBDEFB">Zimbabwe's #1 ZIMSEC O-Level Maths Platform</text>
  <text x="290" y="595" font-family="Arial, sans-serif" font-size="18" fill="#90CAF9">Practice • Learn • Excel 🇿🇼</text>

  <!-- CTA -->
  <rect x="920" y="528" width="200" height="56" rx="28" fill="#2196F3"/>
  <text x="1020" y="561" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="white" text-anchor="middle">Visit Site →</text>
  <text x="1020" y="580" font-family="Arial, sans-serif" font-size="13" fill="#BBDEFB" text-anchor="middle">zimmaths.com</text>
</svg>`;

    res.setHeader("Content-Type", "image/svg+xml");
    res.setHeader("Cache-Control", "public, max-age=86400"); // cache 24 hours
    res.send(svg);
  } catch (error) {
    console.error("Share card error:", error);
    res.status(500).json({ error: "Failed to generate share card" });
  }
});

// Helper — wrap text into SVG tspan elements
function wrapText(text: string, x: number, y: number, maxWidth: number, fontSize: number, color: string): string {
  const charsPerLine = Math.floor(maxWidth / (fontSize * 0.6));
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length <= charsPerLine) {
      currentLine = (currentLine + " " + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // Max 4 lines
  const displayLines = lines.slice(0, 4);
  if (lines.length > 4) {
    displayLines[3] = displayLines[3].slice(0, -3) + "...";
  }

  return displayLines
    .map((line, i) => `<text x="${x}" y="${y + i * (fontSize + 10)}" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${color}">${escapeXml(line)}</text>`)
    .join("\n");
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default router;
