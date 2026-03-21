import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all topics
router.get('/', async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({
      orderBy: { orderIndex: 'asc' }
    });
    res.json({
      success: true,
      count: topics.length,
      data: topics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topics'
    });
  }
});

// GET single topic by slug
router.get('/:slug', async (req, res) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { slug: req.params.slug }
    });
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Topic not found'
      });
    }
    res.json({
      success: true,
      data: topic
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch topic'
    });
  }
});

// GET lessons for a topic by slug
router.get("/:slug/lessons", async (req, res) => {
  try {
    const topic = await prisma.topic.findUnique({
      where: { slug: req.params.slug },
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        error: "Topic not found",
      });
    }

    const lessons = await prisma.lesson.findMany({
      where: { topicId: topic.id },
      orderBy: { orderIndex: "asc" },
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

    return res.json({
      success: true,
      count: lessons.length,
      data: lessons,
    });
  } catch (error) {
    console.error("Lessons fetch error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch lessons",
    });
  }
});

export default router;