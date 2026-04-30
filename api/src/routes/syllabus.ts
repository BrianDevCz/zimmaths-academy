import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";
import jwt from "jsonwebtoken";

const router = Router();

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET /api/syllabus — get current syllabus preferences
router.get("/", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Not authenticated." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { syllabusChoice: true, activeSyllabus: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }

  return res.json({ success: true, data: user });
});

// PUT /api/syllabus/choose — set syllabus choice (signup flow)
router.put("/choose", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Not authenticated." });
  }

  const { syllabusChoice } = req.body;
  if (!syllabusChoice || !Array.isArray(syllabusChoice)) {
    return res.status(400).json({ success: false, error: "syllabusChoice must be an array." });
  }

  const valid = syllabusChoice.every((s: string) => ["A", "B", "BOTH"].includes(s));
  if (!valid) {
    return res.status(400).json({ success: false, error: "Invalid syllabus choice." });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      syllabusChoice,
      activeSyllabus: syllabusChoice.includes("BOTH") ? "BOTH" : syllabusChoice[0],
    },
    select: { syllabusChoice: true, activeSyllabus: true },
  });

  return res.json({ success: true, data: user });
});

// PUT /api/syllabus/switch — switch active syllabus (quick toggle)
router.put("/switch", async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) {
    return res.status(401).json({ success: false, error: "Not authenticated." });
  }

  const { activeSyllabus } = req.body;
  if (!activeSyllabus || !["A", "B", "BOTH"].includes(activeSyllabus)) {
    return res.status(400).json({ success: false, error: "Invalid syllabus." });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { syllabusChoice: true },
  });

  if (!user) {
    return res.status(404).json({ success: false, error: "User not found." });
  }

  // Only allow switching to a syllabus the user has chosen
  const allowed = user.syllabusChoice.includes("BOTH")
    ? true
    : user.syllabusChoice.includes(activeSyllabus);

  if (!allowed) {
    return res.status(400).json({ success: false, error: "You can only switch to syllabuses you chose." });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { activeSyllabus },
    select: { activeSyllabus: true },
  });

  return res.json({ success: true, data: updated });
});

export default router;