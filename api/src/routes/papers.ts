import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
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

// GET all papers
router.get('/', async (req: Request, res: Response) => {
  try {
    const { year, session, paper, topic, difficulty } = req.query;
    const userId = getUserId(req);
    const syllabusFilter = await buildSyllabusFilter(userId || undefined);

    const where: any = { ...syllabusFilter };

    if (year) where.year = parseInt(year as string);
    if (session) where.session = session;
    if (paper) where.paperNumber = parseInt(paper as string);
    if (difficulty) where.difficultyOverall = difficulty;

    const papers = await prisma.paper.findMany({
      where,
      include: {
        _count: { select: { questions: true } }
      }
    });

    // Natural sort by title (Practice 1, Practice 2, ... Practice 10, Practice 11)
    papers.sort((a, b) => {
      const numA = parseInt(a.title.match(/\d+/)?.[0] || '0');
      const numB = parseInt(b.title.match(/\d+/)?.[0] || '0');
      return numA - numB;
    });

    res.json({
      success: true,
      count: papers.length,
      data: papers
    });

  } catch (error) {
    console.error('Papers error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch papers'
    });
  }
});

// GET single paper with questions
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const paper = await prisma.paper.findUnique({
      where: { id: String(req.params.id) },
      include: {
        questions: {
          orderBy: { questionNumber: 'asc' },
          include: {
            topic: { select: { name: true, slug: true, icon: true } }
          }
        }
      }
    });

    if (!paper) {
      return res.status(404).json({
        success: false,
        message: 'Paper not found'
      });
    }

    res.json({
      success: true,
      data: paper
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch paper'
    });
  }
});

// GET single question
router.get('/questions/:questionId', async (req: Request, res: Response) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: String(req.params.questionId) },
      include: {
        topic: { select: { name: true, slug: true, icon: true } },
        paper: { select: { title: true, year: true, session: true } }
      }
    });

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    res.json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch question' });
  }
});

export default router;