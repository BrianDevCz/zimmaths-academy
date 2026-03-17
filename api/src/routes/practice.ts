import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Generate a practice test
router.post('/generate', async (req: Request, res: Response) => {
  try {
    const { topicSlug, difficulty, count } = req.body;

    const where: any = {};

    if (topicSlug && topicSlug !== 'mixed') {
      const topic = await prisma.topic.findUnique({
        where: { slug: topicSlug }
      });
      if (topic) where.topicId = topic.id;
    }

    if (difficulty && difficulty !== 'mixed') {
      where.difficulty = difficulty;
    }

    const questionCount = parseInt(count) || 5;

    // Get all matching questions
    const allQuestions = await prisma.question.findMany({
      where,
      include: {
        topic: { select: { name: true, slug: true } }
      }
    });

    if (allQuestions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No questions found for these settings. Try different filters.'
      });
    }

    // Shuffle and pick random questions
    const shuffled = allQuestions.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, allQuestions.length));

    // Remove solution from questions (don't reveal answers during test)
    const questions = selected.map(q => ({
      id: q.id,
      questionNumber: q.questionNumber,
      questionText: q.questionText,
      marks: q.marks,
      difficulty: q.difficulty,
      topic: q.topic,
    }));

    res.json({
      success: true,
      count: questions.length,
      data: questions
    });

  } catch (error) {
    console.error('Practice generate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate practice test'
    });
  }
});

// Submit practice test answers
router.post('/submit', async (req: Request, res: Response) => {
  try {
    const { answers } = req.body;
    // answers = [{ questionId, userAnswer }]

    if (!answers || answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No answers provided'
      });
    }

    // Get correct answers from database
    const questionIds = answers.map((a: any) => a.questionId);
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { topic: { select: { name: true } } }
    });

    // Mark each answer
    const results = answers.map((answer: any) => {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) return null;

      // Simple text comparison for now
      const correctAnswer = question.solutionText || '';
      const isCorrect = answer.userAnswer?.toLowerCase().trim() ===
        correctAnswer.toLowerCase().trim();

      return {
        questionId: question.id,
        questionText: question.questionText,
        userAnswer: answer.userAnswer,
        correctAnswer: question.solutionText,
        isCorrect,
        marks: question.marks,
        topic: question.topic?.name,
        difficulty: question.difficulty,
      };
    }).filter(Boolean);

    const totalMarks = results.reduce((sum: number, r: any) => sum + r.marks, 0);
    const earnedMarks = results
      .filter((r: any) => r.isCorrect)
      .reduce((sum: number, r: any) => sum + r.marks, 0);
    const scorePercentage = totalMarks > 0
      ? Math.round((earnedMarks / totalMarks) * 100)
      : 0;

    res.json({
      success: true,
      score: scorePercentage,
      correct: results.filter((r: any) => r.isCorrect).length,
      total: results.length,
      results
    });

  } catch (error) {
    console.error('Practice submit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit answers'
    });
  }
});

export default router;