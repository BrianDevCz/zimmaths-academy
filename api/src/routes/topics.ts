import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import jwt from 'jsonwebtoken';
import { awardPoints } from '../points';
import { checkBadgesAfterLessonComplete } from '../badges';

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

// GET all topics
router.get('/', async (req: Request, res: Response) => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' },
    });
    res.json({ success: true, count: topics.length, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch topics' });
  }
});

// GET single topic by slug
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const slug = String(req.params.slug);
    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (!topic) {
      return res.status(404).json({ success: false, message: 'Topic not found' });
    }
    res.json({ success: true, data: topic });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch topic' });
  }
});

// GET lessons for a topic by slug
router.get('/:slug/lessons', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const slug = String(req.params.slug);

    const topic = await prisma.topic.findUnique({ where: { slug } });
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Topic not found' });
    }

    const lessons = await prisma.lesson.findMany({
      where: { topicId: topic.id },
      orderBy: { orderIndex: 'asc' },
      select: {
        id: true,
        title: true,
        content: true,
        orderIndex: true,
        isFree: true,
        estimatedMinutes: true,
        videoUrl: true,
        geogebraUrl: true,
        imageUrl: true,
        publishedAt: true,
      },
    });

    // Get user's completed lessons for this topic
    let completedLessonIds: string[] = [];
    if (userId) {
      const progress = await prisma.userLessonProgress.findMany({
        where: { userId, lessonId: { in: lessons.map((l) => l.id) } },
        select: { lessonId: true },
      });
      completedLessonIds = progress.map((p) => p.lessonId);
    }

    const lessonsWithProgress = lessons.map((lesson) => ({
      ...lesson,
      completed: completedLessonIds.includes(lesson.id),
    }));

    return res.json({ success: true, count: lessons.length, data: lessonsWithProgress });
  } catch (error) {
    console.error('Lessons fetch error:', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch lessons' });
  }
});

// POST mark lesson as complete
router.post('/lessons/:lessonId/complete', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated.' });
    }

    const lessonId = String(req.params.lessonId);

    // Check lesson exists — include topic
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { topic: { select: { id: true, name: true, slug: true } } },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: 'Lesson not found.' });
    }

    // Check if already completed
    const existing = await prisma.userLessonProgress.findFirst({
      where: { userId, lessonId },
    });

    if (existing) {
      return res.json({ success: true, message: 'Already completed.', pointsAwarded: 0, badgesAwarded: [] });
    }

    // Mark as complete
    await prisma.userLessonProgress.create({
      data: { userId, lessonId },
    });

    // Award lesson completion points
    let pointsAwarded = await awardPoints(userId, 'lesson_complete', lessonId);

    // Check if all lessons in topic are now complete
    const allTopicLessons = await prisma.lesson.findMany({
      where: { topicId: lesson.topic.id },
      select: { id: true },
    });

    const completedInTopic = await prisma.userLessonProgress.count({
      where: {
        userId,
        lessonId: { in: allTopicLessons.map((l) => l.id) },
      },
    });

    // Award topic completion bonus if all lessons done
    if (completedInTopic === allTopicLessons.length) {
      pointsAwarded += await awardPoints(userId, 'topic_complete', lesson.topic.id);
    }

    // Check badges
    const badgesAwarded = await checkBadgesAfterLessonComplete(userId);

    return res.json({
      success: true,
      message: 'Lesson marked as complete!',
      pointsAwarded,
      badgesAwarded,
      topicCompleted: completedInTopic === allTopicLessons.length,
      topicName: lesson.topic.name,
    });
  } catch (error) {
    console.error('Lesson complete error:', error);
    return res.status(500).json({ success: false, error: 'Failed to mark lesson as complete.' });
  }
});

export default router;
