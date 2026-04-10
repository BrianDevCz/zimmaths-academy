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
    const { topicSlug, difficulty, count, excludeIds } = req.body;
    const where: any = {};

    if (topicSlug && topicSlug !== "mixed") {
      const topic = await prisma.topic.findUnique({ where: { slug: topicSlug } });
      if (topic) where.topicId = topic.id;
    }

    if (difficulty && difficulty !== "mixed") {
      where.difficulty = difficulty;
    }

    const questionCount = Math.min(parseInt(count) || 5, 20);

    // Check if user has premium subscription
    let isPremium = false;
    if (req.userId) {
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: req.userId,
          status: "active",
          expiresAt: { gt: new Date() },
        },
      });
      isPremium = !!subscription;
    }

    // Non-premium users only get free questions
    if (!isPremium) {
      where.isFree = true;
    }

    const allQuestions = await prisma.question.findMany({
      where,
      include: { topic: { select: { name: true, slug: true } } },
    });

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        error: isPremium
          ? "No questions found for these settings. Try different filters."
          : "No free questions found for these settings. Upgrade to access all questions.",
      });
    }

    // Fisher-Yates proper unbiased shuffle
    const shuffled = [...allQuestions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    // Avoid recently seen questions if client sends excluded IDs
    const recentlySeenIds: string[] = Array.isArray(excludeIds) ? excludeIds : [];
    const filtered = recentlySeenIds.length > 0
      ? shuffled.filter((q) => !recentlySeenIds.includes(q.id))
      : shuffled;

    // Fall back to full pool if exclusions leave too few questions
    const pool = filtered.length >= questionCount ? filtered : shuffled;
    const selected = pool.slice(0, Math.min(questionCount, pool.length));

    const questions = selected.map((q) => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      questionImageUrl: (q as any).questionImageUrl || null,
      marks: q.marks,
      difficulty: q.difficulty,
      topic: q.topic,
      isFree: q.isFree,
    }));

    return res.json({
      success: true,
      count: questions.length,
      isPremium,
      data: questions,
    });
  } catch (error) {
    console.error("Practice generate error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to generate practice test.",
    });
  }
});

// POST /api/practice/ocr
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

    console.log(`Submit received — ${answers.length} answers`);

    const questionIds = answers.map((a: any) => a.questionId);

    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { name: true, slug: true } } },
    });

    console.log(`Found ${questions.length} questions in DB`);

    // Mark each answer
    const results = await Promise.all(
      answers.map(async (answer: any) => {
        const question = questions.find((q) => q.id === answer.questionId);
        if (!question) return null;

        const correctAnswer = (question as any).correctAnswer || question.solutionText || "";
        const solutionText = question.solutionText || "";

        // Get part answers — clean out any empty parts
        let partAnswers: { [key: string]: string } | null = answer.partAnswers || null;
        if (partAnswers) {
          const cleaned: { [key: string]: string } = {};
          for (const part of Object.keys(partAnswers)) {
            const val = (partAnswers[part] || "").trim();
            if (val) cleaned[part] = val;
          }
          // If no parts had actual answers, treat as no answer
          partAnswers = Object.keys(cleaned).length > 0 ? cleaned : null;
        }

        // Build the combined user answer string
        const rawSingleAnswer = (answer.userAnswer || "").trim();
        const userAnswer = partAnswers
          ? Object.entries(partAnswers)
              .map(([k, v]) => `(${k}) ${v}`)
              .join(" ")
          : rawSingleAnswer;

        // Determine if any answer was actually given
        const hasAnyAnswer = partAnswers !== null
          ? Object.keys(partAnswers).length > 0
          : rawSingleAnswer.length > 0;

        console.log(`Q${question.questionNumber} — hasAnswer: ${hasAnyAnswer}, answer: "${userAnswer.slice(0, 60)}"`);

        let finalResult;

        // No answer given — always wrong, never call AI
        if (!hasAnyAnswer) {
          finalResult = {
            isCorrect: false,
            isPartiallyCorrect: false,
            marksAwarded: 0,
            totalMarks: question.marks,
            confidence: "wrong" as const,
            feedback: "No answer given.",
            workingShown: false,
            method: "smart" as const,
            partResults: undefined,
          };
        } else {
          try {
            if (partAnswers && Object.keys(partAnswers).length > 0) {
              console.log(`Using AI marking (${Object.keys(partAnswers).length} parts answered)...`);
              finalResult = await markAnswerWithAI(
                question.questionText,
                userAnswer,
                correctAnswer,
                solutionText,
                question.marks,
                partAnswers
              );
            } else {
              const smartResult = markAnswer(rawSingleAnswer, correctAnswer, solutionText);
              console.log(`Smart marking confidence: ${smartResult.confidence}`);

              if (smartResult.confidence === "exact" || smartResult.confidence === "numerical") {
                finalResult = {
                  isCorrect: smartResult.isCorrect,
                  isPartiallyCorrect: false,
                  marksAwarded: smartResult.isCorrect ? question.marks : 0,
                  totalMarks: question.marks,
                  confidence: smartResult.confidence,
                  feedback: smartResult.feedback,
                  workingShown: false,
                  method: "smart" as const,
                  partResults: undefined,
                };
              } else {
                console.log("Using AI marking (ambiguous answer)...");
                finalResult = await markAnswerWithAI(
                  question.questionText,
                  rawSingleAnswer,
                  correctAnswer,
                  solutionText,
                  question.marks
                );
              }
            }
            console.log(`Marking done — isCorrect: ${finalResult.isCorrect}, marks: ${finalResult.marksAwarded}/${finalResult.totalMarks}`);
          } catch (markErr) {
            console.error(`Marking error for Q${question.questionNumber}:`, markErr);
            finalResult = {
              isCorrect: false,
              isPartiallyCorrect: false,
              marksAwarded: 0,
              totalMarks: question.marks,
              confidence: "wrong" as const,
              feedback: "Could not mark this answer automatically.",
              workingShown: false,
              method: "smart" as const,
              partResults: undefined,
            };
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
          partResults: (finalResult as any).partResults || [],
        };
      })
    );

    console.log("All questions marked — building summary");

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

    console.log(`Submit complete — score: ${scorePercentage}%`);

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