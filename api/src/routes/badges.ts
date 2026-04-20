import { Router, Request, Response } from 'express';
import { getUserBadges } from '../badges';
import jwt from 'jsonwebtoken';

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

export default router;
