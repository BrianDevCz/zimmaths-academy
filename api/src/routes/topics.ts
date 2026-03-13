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

export default router;