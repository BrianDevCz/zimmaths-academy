import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET today's challenge
router.get('/today', async (req: Request, res: Response) => {
  try {
    // Get today's date (Zimbabwe time UTC+2)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Find today's challenge
    let challenge = await prisma.dailyChallenge.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        question: {
          include: {
            topic: { select: { name: true, slug: true } }
          }
        }
      }
    });

    // If no challenge exists for today, create one automatically
    if (!challenge) {
      // Get a random eligible question
      const questions = await prisma.question.findMany({
        where: { isDailyEligible: true }
      });

      if (questions.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No daily challenge available today'
        });
      }

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      challenge = await prisma.dailyChallenge.create({
        data: {
          questionId: randomQuestion.id,
          date: today,
        },
        include: {
          question: {
            include: {
              topic: { select: { name: true, slug: true } }
            }
          }
        }
      });
    }

    // Don't reveal solution in today's challenge
    const { question, ...challengeData } = challenge;
    const { solutionText, solutionSteps, ...questionWithoutSolution } = question as any;

    res.json({
      success: true,
      data: {
        ...challengeData,
        question: questionWithoutSolution,
        // Only reveal solution if it's from a previous day
        solutionRevealed: false,
      }
    });

  } catch (error) {
    console.error('Daily challenge error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily challenge'
    });
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
          lt: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        question: {
          include: {
            topic: { select: { name: true, slug: true } }
          }
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'No challenge found for yesterday'
      });
    }

    res.json({
      success: true,
      data: {
        ...challenge,
        solutionRevealed: true,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch yesterday challenge'
    });
  }
});

// POST submit attempt
router.post('/attempt', async (req: Request, res: Response) => {
  try {
    const { challengeId, userAnswer } = req.body;

    if (!challengeId || !userAnswer) {
      return res.status(400).json({
        success: false,
        message: 'Challenge ID and answer are required'
      });
    }

    // Get the challenge with question
    const challenge = await prisma.dailyChallenge.findUnique({
      where: { id: challengeId },
      include: { question: true }
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        message: 'Challenge not found'
      });
    }

    // Update attempt count
    await prisma.dailyChallenge.update({
      where: { id: challengeId },
      data: {
        totalAttempts: { increment: 1 }
      }
    });

    res.json({
      success: true,
      message: 'Answer submitted! Come back tomorrow to see the solution.',
      data: {
        submitted: true,
        challengeId,
        userAnswer,
      }
    });

  } catch (error) {
    console.error('Attempt error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit attempt'
    });
  }
});

// GET challenge stats
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const totalChallenges = await prisma.dailyChallenge.count();
    const totalAttempts = await prisma.dailyChallenge.aggregate({
      _sum: { totalAttempts: true }
    });

    res.json({
      success: true,
      data: {
        totalChallenges,
        totalAttempts: totalAttempts._sum.totalAttempts || 0,
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
});

export default router;