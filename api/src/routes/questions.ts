import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET random questions for practice — PUBLIC
router.get("/", async (req: any, res: Response) => {
  try {
    const { topic, difficulty, count = "5", exclude } = req.query;

    const excludeIds = exclude
      ? String(exclude).split(",").filter(Boolean)
      : [];

    const where: any = {};
    if (topic) where.topic = { slug: String(topic) };
    if (difficulty && difficulty !== "mixed")
      where.difficulty = String(difficulty);
    if (excludeIds.length > 0) where.id = { notIn: excludeIds };

    const questions = await prisma.question.findMany({
      where,
      take: Math.min(parseInt(String(count)), 20),
      orderBy: { questionNumber: "asc" },
      include: {
        topic: { select: { name: true, slug: true } },
      },
    });

    const safeQuestions = questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionImageUrl: (q as any).questionImageUrl,
      marks: q.marks,
      difficulty: q.difficulty,
      topic: q.topic,
      isFree: q.isFree,
    }));

    return res.status(200).json({
      success: true,
      data: safeQuestions,
      count: safeQuestions.length,
    });
  } catch (error) {
    console.error("Questions fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch questions. Please try again.",
    });
  }
});

// GET single question by ID — AUTH REQUIRED
router.get("/:id", async (req: AuthRequest, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: String(req.params.id) },
      include: {
        topic: { select: { name: true, slug: true, icon: true } },
        paper: {
          select: {
            title: true,
            year: true,
            session: true,
            paperNumber: true,
          },
        },
      },
    });

    if (!question) {
      return res.status(404).json({
        success: false,
        error: "Question not found",
      });
    }

    let hasPremium = false;

    // Optionally decode token if present — auth is not required to view question
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          authHeader.split(" ")[1],
          process.env.JWT_SECRET as string
        ) as { userId: string };
        if (decoded?.userId) {
          const subscription = await prisma.subscription.findFirst({
            where: {
              userId: decoded.userId,
              status: "active",
              expiresAt: { gt: new Date() },
            },
          });
          hasPremium = !!subscription;
        }
      } catch {
        // Invalid token — treat as guest
      }
    }

    const canViewSolution = question.isFree || hasPremium;

    const responseData = {
      ...question,
      solutionSteps: canViewSolution ? question.solutionSteps : null,
      solutionText: canViewSolution ? question.solutionText : null,
      locked: !canViewSolution,
      upgradeUrl: !canViewSolution ? "/upgrade" : null,
    };

    return res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (error) {
    console.error("Question fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch question. Please try again.",
    });
  }
});

export default router;