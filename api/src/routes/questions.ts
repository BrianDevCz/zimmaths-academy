import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// GET single question by ID
// Solution is gated — only returned if question is free OR user has active premium
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

    // Check if user has premium access
    let hasPremium = false;

    if (req.userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: req.userId,
          status: "active",
          expiresAt: { gt: new Date() },
        },
      });
      hasPremium = !!subscription;
    }

    // Determine if solution should be returned
    const canViewSolution = question.isFree || hasPremium;

    // Strip solution data if user cannot access it
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

// GET random questions for practice
router.get("/", async (req: AuthRequest, res: Response) => {
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
      take: Math.min(parseInt(String(count)), 20), // Max 20 per request
      orderBy: { id: "asc" },
      include: {
        topic: { select: { name: true, slug: true } },
      },
    });

    // For practice mode — return questions without solutions
    // Solutions are fetched separately when student submits answer
    const safeQuestions = questions.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionImageUrl: q.questionImageUrl,
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

export default router;