import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { awardPoints } from "../points";
import { markAnswer } from "../marking";
import { markAnswerWithAI, extractTextFromImage } from "../aiMarking";

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

    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));

    const questions = selected.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionImageUrl: (q as any).questionImageUrl || null,
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

// POST /api/practice/ocr
// Accepts a base64 image, returns extracted text
router.post("/ocr", async (req: AuthRequest, res: Response) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, error: "No image provided." });
    }

    const extractedText = await extractTextFromImage(imageBase64);

    return res.json({
      success: true,
      text: extractedText,
    });
  } catch (error) {
    console.error("OCR error:", error);
    return res.status(500).json({ success: false, error: "OCR failed." });
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

    // Mark each answer — smart engine first, AI for uncertain cases
    const results = await Promise.all(
      answers.map(async (answer: any) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (!question) return null;

        const correctAnswer = (question as any).correctAnswer || question.solutionText || "";
        const solutionText = question.solutionText || "";

        // partAnswers: { a: "9,0", b: "5" } — sent when frontend splits by part
        // userAnswer: plain string — sent for single-part questions
        const partAnswers: { [key: string]: string } | null = answer.partAnswers || null;
        const userAnswer = partAnswers
          ? Object.entries(partAnswers)
              .map(([k, v]) => `(${k}) ${v}`)
              .join(" ")
          : answer.userAnswer || "";

        let finalResult;

        if (partAnswers && Object.keys(partAnswers).length > 0) {
          // Per-part answers submitted — always use AI for clean per-part marking
          finalResult = await markAnswerWithAI(
            question.questionText,
            userAnswer,
            correctAnswer,
            solutionText,
            question.marks
          );
        } else {
          // Single answer — smart engine first
          const smartResult = markAnswer(userAnswer, correctAnswer, solutionText);

          if (smartResult.confidence === "exact" || smartResult.confidence === "numerical") {
            finalResult = {
              isCorrect: smartResult.isCorrect,
              isPartiallyCorrect: false,
              marksAwarded: smartResult.isCorrect ? question.marks : 0,
              totalMarks: question.marks,
              confidence: smartResult.confidence,
              feedback: smartResult.feedback,
              workingShown: false,
              method: "smart",
            };
          } else {
            finalResult = await markAnswerWithAI(
              question.questionText,
              userAnswer,
              correctAnswer,
              solutionText,
              question.marks
            );
          }
        }

        return {
          questionId: question.id,
          questionText: question.questionText,
          questionImageUrl: (question as any).questionImageUrl || null,
          userAnswer,
          partAnswers,
          correctAnswer,
          solutionSteps: question.solutionSteps,
          isCorrect: finalResult.isCorrect,
          isPartiallyCorrect: finalResult.isPartiallyCorrect,
          marksAwarded: finalResult.marksAwarded,
          totalMarks: finalResult.totalMarks,
          confidence: finalResult.confidence,
          feedback: finalResult.feedback,
          marks: question.marks,
          topic: question.topic?.name,
          difficulty: question.difficulty,
          markingMethod: finalResult.method,
          partResults: finalResult.partResults || [],
        };
      })
    );

    const validResults = results.filter(Boolean);
    const totalQuestions = validResults.length;
    const correctCount = validResults.filter((r: any) => r.isCorrect).length;
    const totalMarksAvailable = validResults.reduce(
      (sum: number, r: any) => sum + (r.totalMarks || 0), 0
    );
    const totalMarksAwarded = validResults.reduce(
      (sum: number, r: any) => sum + (r.marksAwarded || 0), 0
    );
    const scorePercentage =
      totalMarksAvailable > 0
        ? Math.round((totalMarksAwarded / totalMarksAvailable) * 100)
        : 0;

    // Award points
    let pointsAwarded = 0;
    if (req.userId) {
      if (totalQuestions >= 20) {
        pointsAwarded += await awardPoints(req.userId, "practice_20q");
      } else if (totalQuestions >= 10) {
        pointsAwarded += await awardPoints(req.userId, "practice_10q");
      } else {
        pointsAwarded += await awardPoints(req.userId, "practice_5q");
      }

      if (scorePercentage === 100) {
        pointsAwarded += await awardPoints(req.userId, "practice_bonus_100");
      } else if (scorePercentage >= 80) {
        pointsAwarded += await awardPoints(req.userId, "practice_bonus_80");
      }

      await prisma.practiceTest.create({
        data: {
          userId: req.userId,
          difficulty: req.body.difficulty || "mixed",
          questionCount: totalQuestions,
          scorePercentage,
          timeTakenSeconds: req.body.timeTaken || 0,
          questionsData: validResults as any,
        },
      });
    }

    return res.json({
      success: true,
      data: {
        results: validResults,
        summary: {
          totalQuestions,
          correctCount,
          totalMarksAvailable,
          totalMarksAwarded,
          scorePercentage,
          pointsAwarded,
        },
      },
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