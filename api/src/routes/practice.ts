import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { awardPoints } from "../points";

const router = Router();
const prisma = new PrismaClient();

// POST /api/practice/generate
router.post("/generate", async (req: AuthRequest, res: Response) => {
  try {
    const { topicSlug, difficulty, count } = req.body;
    const where: any = {};

    if (topicSlug && topicSlug !== "mixed") {
      const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } });
      if (topic) where.topicId = topic.id;
    }

    if (difficulty && difficulty !== "mixed") {
      where.difficulty = difficulty;
    }

    const questionCount = Math.min(parseInt(count) || 5, 20);

    const allQuestions = await prisma.question.findMany({
      where,
      include: { topic: { select: { name: true, slug: true } } },
    });

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: "No questions found for these settings. Try different filters.",
      });
    }

    // Shuffle and pick random questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));

    // Never send solution data during the test
    const questions = selected.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      marks: q.marks,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    return res.json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    console.error("Practice generate error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate practice test.",
    });
  }
});

// POST /api/practice/submit
router.post("/submit", async (req: AuthRequest, res: Response) => {
  try {
    const { answers } = req.body;

    if (!answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        error: "No answers provided.",
      });
    }

    const questionIds = answers.map((a: any) => a.questionId);

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { name: true, slug: true } } },
    });

    // Mark each answer
    const results = answers.map((answer: any) => {
      const question = questions.find((q) => q.id === answer.questionId);
      if (!question) return null;

      const correctAnswer = (question.solutionText || "").toLowerCase().trim();
      const userAnswer = (answer.userAnswer || "").toLowerCase().trim();
      const isCorrect = userAnswer === correctAnswer && userAnswer !== "";

      return {
        questionId: question.id,
        questionText: question.questionText,
        userAnswer: answer.userAnswer,
        correctAnswer: question.solutionText,
        solutionSteps: question.solutionSteps,
        isCorrect,
        marks: question.marks,
        topic: question.topic?.name,
        difficulty: question.difficulty,
      };
    }).filter(Boolean);

    const totalQuestions = results.length;
    const correctCount = results.filter((r: any) => r.isCorrect).length;
    const scorePercentage = totalQuestions > 0
      ? Math.round((correctCount / totalQuestions) * 100)
      : 0;

    // Award points if user is logged in
    let pointsAwarded = 0;
    if (req.userId) {
      // Points for completing the test
      if (totalQuestions >= 20) {
        pointsAwarded += await awardPoints(req.userId, "practice_20q");
      } else if (totalQuestions >= 10) {
        pointsAwarded += await awardPoints(req.userId, "practice_10q");
      } else {
        pointsAwarded += await awardPoints(req.userId, "practice_5q");
      }

      // Bonus points for high scores
      if (scorePercentage === 100) {
        pointsAwarded += await awardPoints(req.userId, "practice_bonus_100");
      } else if (scorePercentage >= 80) {
        pointsAwarded += await awardPoints(req.userId, "practice_bonus_80");
      }

      // Save practice test result
      await prisma.practiceTest.create({
        data: {
          userId: req.userId,
          difficulty: req.body.difficulty || "mixed",
          questionCount: totalQuestions,
          scorePercentage,
          timeTakenSeconds: req.body.timeTaken || 0,
          questionsData: results as any,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        results,
        summary: {
          totalQuestions,
          correctCount,
          scorePercentage,
          pointsAwarded
        }
      }
    });
  } catch (error) {
    console.error("Practice submit error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to submit practice test.",
    });
  }
});

export default router;