import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();

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

// GET all bookmarks for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const bookmarks = await prisma.bookmark.findMany({
      where: { userId },
      include: {
        question: {
          include: {
            topic: { select: { name: true, slug: true, icon: true } },
            paper: { select: { title: true, year: true, session: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: bookmarks });
  } catch (error) {
    console.error('Get bookmarks error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch bookmarks.' });
  }
});

// POST add bookmark
router.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const { questionId, note } = req.body;
    if (!questionId) return res.status(400).json({ success: false, error: 'Question ID required.' });

    // Check if already bookmarked
    const existing = await prisma.bookmark.findFirst({
      where: { userId, questionId },
    });

    if (existing) {
      return res.status(400).json({ success: false, error: 'Already bookmarked.' });
    }

    const bookmark = await prisma.bookmark.create({
      data: { userId, questionId, note: note || null },
    });

    res.json({ success: true, data: bookmark });
  } catch (error) {
    console.error('Add bookmark error:', error);
    res.status(500).json({ success: false, error: 'Failed to add bookmark.' });
  }
});

// DELETE remove bookmark
router.delete('/:questionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const questionId = String(req.params.questionId);

    await prisma.bookmark.deleteMany({
      where: { userId, questionId },
    });

    res.json({ success: true, message: 'Bookmark removed.' });
  } catch (error) {
    console.error('Remove bookmark error:', error);
    res.status(500).json({ success: false, error: 'Failed to remove bookmark.' });
  }
});

// GET check if a question is bookmarked
router.get('/check/:questionId', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.json({ success: true, isBookmarked: false });

    const questionId = String(req.params.questionId);

    const bookmark = await prisma.bookmark.findFirst({
      where: { userId, questionId },
    });

    res.json({ success: true, isBookmarked: !!bookmark });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to check bookmark.' });
  }
});

export default router;
