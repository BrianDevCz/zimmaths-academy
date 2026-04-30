import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { awardPoints } from '../points';
import { checkBadgesAfterDailyChallenge } from '../badges';
import { buildSyllabusFilter } from "../middleware/syllabusFilter";

const router = Router();

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// GET today's challenge
router.get('/today', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let challenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        question: {
          include: {
            topic: { select: { name: true, slug: true } },
          },
        },
      },
    });

    // Auto-create if none exists
    if (!challenge) {
      const syllabusFilter = await buildSyllabusFilter(userId || undefined);
      const questions = await prisma.question.findMany({
        where: {
          isDailyEligible: true,
          ...syllabusFilter,
        },
      });

      if (questions.length === 0) {
        return res.status(404).json({ success: false, message: 'No daily challenge available today' });
      }

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
      challenge = await prisma.dailyChallenge.create({
        data: { questionId: randomQuestion.id, date: today },
        include: {
          question: {
            include: { topic: { select: { name: true, slug: true } } },
          },
        },
      });
    }

    // Check if user already attempted today
    let userAttempt = null;
    if (userId) {
      userAttempt = await prisma.dailyChallengeAttempt.findFirst({
        where: { userId, dailyChallengeId: challenge.id },
      });
    }

    const { question, ...challengeData } = challenge;
    const { solutionText, solutionSteps, correctAnswer, ...questionWithoutSolution } = question as any;

    res.json({
      success: true,
      data: {
        ...challengeData,
        question: questionWithoutSolution,
        solutionRevealed: false,
        userAttempt: userAttempt ? {
          submitted: true,
          userAnswer: userAttempt.userAnswer,
          isCorrect: userAttempt.isCorrect,
          pointsAwarded: userAttempt.pointsAwarded,
        } : null,
      },
    });
  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily challenge' });
  }
});

// GET yesterday's challenge with solution
router.get('/yesterday', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);

    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: yesterday,
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000),
        },
      },
      include: {
        question: {
          include: { topic: { select: { name: true, slug: true } } },
        },
      },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'No challenge found for yesterday' });
    }

    res.json({ success: true, data: { ...challenge, solutionRevealed: true } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch yesterday challenge' });
  }
});

// POST submit attempt
router.post('/attempt', async (req: Request, res: Response) => {
  try {
    const { challengeId, userAnswer } = req.body;
    const userId = getUserId(req);

    if (!challengeId || !userAnswer) {
      return res.status(400).json({ success: false, message: 'Challenge ID and answer are required' });
    }

    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: { question: true },
    });

    if (!challenge) {
      return res.status(404).json({ success: false, message: 'Challenge not found' });
    }

    // Check if user already attempted
    if (userId) {
      const existing = await prisma.dailyChallengeAttempt.findFirst({
        where: { userId, dailyChallengeId: challengeId },
      });
      if (existing) {
        return res.status(400).json({ success: false, message: 'You have already attempted today\'s challenge.' });
      }
    }

    // Simple answer check
    const correct = (challenge.question as any).correctAnswer || '';
    const isCorrect = correct.trim().toLowerCase() === userAnswer.trim().toLowerCase();

    // Update attempt count
    await prisma.dailyChallenge.update({
      where: { id: challengeId },
      data: {
        totalAttempts: { increment: 1 },
        correctAttempts: isCorrect ? { increment: 1 } : undefined,
      },
    });

    // Award points and check badges if logged in
    let pointsAwarded = 0;
    let badgesAwarded: string[] = [];

    if (userId) {
      // Save attempt
      await prisma.dailyChallengeAttempt.create({
        data: {
          userId,
          dailyChallengeId: challengeId,
          userAnswer,
          isCorrect,
          pointsAwarded: isCorrect ? 20 : 5,
        },
      });

      // Award points
      if (isCorrect) {
        pointsAwarded = await awardPoints(userId, 'daily_correct');
      } else {
        pointsAwarded = await awardPoints(userId, 'daily_attempt');
      }

      // Check badges
      badgesAwarded = await checkBadgesAfterDailyChallenge(userId);
    }

    res.json({
      success: true,
      message: 'Answer submitted! Come back tomorrow to see the solution.',
      data: {
        submitted: true,
        isCorrect,
        pointsAwarded,
        badgesAwarded,
        challengeId,
        userAnswer,
      },
    });
  } catch (error) {
    console.error('Attempt error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit attempt' });
  }
});

// GET challenge stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalChallenges = await prisma.dailyChallenge.count();
    const totalAttempts = await prisma.dailyChallenge.aggregate({
      _sum: { totalAttempts: true },
    });

    res.json({
      success: true,
      data: {
        totalChallenges,
        totalAttempts: totalAttempts._sum.totalAttempts || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET user's challenge history
router.get('/history', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const attempts = await prisma.dailyChallengeAttempt.findMany({
      where: { userId },
      include: {
        dailyChallenge: {
          include: {
            question: { select: { questionText: true, topic: { select: { name: true } } } },
          },
        },
      },
      orderBy: { attemptedAt: 'desc' },
      take: 30,
    });

    res.json({ success: true, data: attempts });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch history' });
  }
});

export default router;