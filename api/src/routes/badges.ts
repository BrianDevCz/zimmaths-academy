import { Router, Request, Response } from 'express';
import { getUserBadges } from '../badges';
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

// GET all badges for current user
router.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    const badges = await getUserBadges(userId);
    const earnedCount = badges.filter((b) => b.earned).length;

    res.json({ success: true, data: badges, earnedCount, totalCount: badges.length });
  } catch (error) {
    console.error('Get badges error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch badges.' });
  }
});

// POST track WhatsApp share — for Social Learner badge
router.post('/track-share', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) return res.status(401).json({ success: false, error: 'Not authenticated.' });

    // Award a small share point
    await prisma.userPoint.create({
      data: { userId, points: 2, source: 'whatsapp_share' },
    });

    // Count total shares
    const shareCount = await prisma.userPoint.count({
      where: { userId, source: 'whatsapp_share' },
    });

    // Award Social Learner badge at 20 shares
    let badgeAwarded = false;
    if (shareCount >= 20) {
      const existing = await prisma.userBadge.findFirst({
        where: { userId, badgeSlug: 'social-learner' },
      });
      if (!existing) {
        await prisma.userBadge.create({ data: { userId, badgeSlug: 'social-learner' } });
        badgeAwarded = true;
      }
    }

    res.json({
      success: true,
      shareCount,
      badgeAwarded,
      message: badgeAwarded ? '🏅 Social Learner badge earned!' : `${shareCount}/20 shares tracked`,
    });
  } catch (error) {
    console.error('Track share error:', error);
    res.status(500).json({ success: false, error: 'Failed to track share.' });
  }
});

export default router;
