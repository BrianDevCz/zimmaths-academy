import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

// GET /api/admin/stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers,
      totalPapers,
      totalQuestions,
      activeSubscriptions,
      totalRevenue,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.paper.count(),
      prisma.question.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.aggregate({
        where: { status: "active" },
        _sum: { amountUsd: true },
      }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          grade: true,
          createdAt: true,
          role: true,
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalPapers,
        totalQuestions,
        activeSubscriptions,
        totalRevenue: totalRevenue._sum.amountUsd || 0,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, error: "Failed to load stats." });
  }
});

// GET /api/admin/users
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        role: true,
        createdAt: true,
        lastActive: true,
        subscription: {
          select: {
            status: true,
            plan: true,
            expiresAt: true,
          },
        },
      },
    });

    return res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ success: false, error: "Failed to load users." });
  }
});

// GET /api/admin/papers
router.get("/papers", async (req: AuthRequest, res: Response) => {
  try {
    const papers = await prisma.paper.findMany({
      orderBy: { year: "desc" },
      include: {
        _count: { select: { questions: true } },
      },
    });

    return res.status(200).json({ success: true, data: papers });
  } catch (error) {
    console.error("Admin papers error:", error);
    return res.status(500).json({ success: false, error: "Failed to load papers." });
  }
});

// POST /api/admin/papers
router.post("/papers", async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      title: z.string().min(1, "Title is required"),
      year: z.number().int().min(2000).max(2030),
      session: z.enum(["june", "november"]),
      paperNumber: z.number().int().min(1).max(2),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    const paper = await prisma.paper.create({ data: parsed.data });

    return res.status(201).json({ success: true, data: paper });
  } catch (error) {
    console.error("Admin create paper error:", error);
    return res.status(500).json({ success: false, error: "Failed to create paper." });
  }
});

// DELETE /api/admin/papers/:id
router.delete("/papers/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.paper.delete({ where: { id: String(req.params.id) } });
    return res.status(200).json({ success: true, message: "Paper deleted." });
  } catch (error) {
    console.error("Admin delete paper error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete paper." });
  }
});

// GET /api/admin/questions
router.get("/questions", async (req: AuthRequest, res: Response) => {
  try {
    const { paperId } = req.query;
    const where = paperId ? { paperId: String(paperId) } : {};

    const questions = await prisma.question.findMany({
      where,
      orderBy: { questionNumber: "asc" },
      include: {
        topic: { select: { name: true } },
        paper: { select: { title: true, year: true } },
      },
    });

    return res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("Admin questions error:", error);
    return res.status(500).json({ success: false, error: "Failed to load questions." });
  }
});

// POST /api/admin/questions
router.post("/questions", async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      paperId: z.string().min(1, "Paper is required"),
      topicId: z.string().min(1, "Topic is required"),
      questionNumber: z.number().int().min(1),
      questionText: z.string().min(1, "Question text is required"),
      marks: z.number().int().min(1),
      difficulty: z.enum(["easy", "medium", "hard"]),
      correctAnswer: z.string().optional(),
      solutionText: z.string().optional(),
      solutionSteps: z.any().optional(),
      isFree: z.boolean().default(false),
      isDailyEligible: z.boolean().default(false),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    const question = await prisma.question.create({ data: parsed.data });

    return res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Admin create question error:", error);
    return res.status(500).json({ success: false, error: "Failed to create question." });
  }
});

// PUT /api/admin/questions/:id
router.put("/questions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const question = await prisma.question.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });

    return res.status(200).json({ success: true, data: question });
  } catch (error) {
    console.error("Admin update question error:", error);
    return res.status(500).json({ success: false, error: "Failed to update question." });
  }
});

// DELETE /api/admin/questions/:id
router.delete("/questions/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.question.delete({ where: { id: String(req.params.id) } });
    return res.status(200).json({ success: true, message: "Question deleted." });
  } catch (error) {
    console.error("Admin delete question error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete question." });
  }
});

// GET /api/admin/subscriptions
router.get("/subscriptions", async (req: AuthRequest, res: Response) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      orderBy: { startedAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true, grade: true },
        },
      },
    });

    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return res.status(500).json({ success: false, error: "Failed to load subscriptions." });
  }
});

// PUT /api/admin/users/:id/role
router.put("/users/:id/role", async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;

    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ success: false, error: "Invalid role." });
    }

    const user = await prisma.user.update({
      where: { id: String(req.params.id) },
      data: { role },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Admin update role error:", error);
    return res.status(500).json({ success: false, error: "Failed to update role." });
  }
});

// PUT /api/admin/subscriptions/:userId/activate
router.put("/subscriptions/:userId/activate", async (req: AuthRequest, res: Response) => {
  try {
    const { plan } = req.body;
    const days = plan === "two_weeks" ? 14 : plan === "annual" ? 365 : 30;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);

    await prisma.subscription.upsert({
      where: { userId: String(req.params.userId) },
      update: { status: "active", plan, expiresAt, startedAt: new Date() },
      create: {
        userId: String(req.params.userId),
        status: "active",
        plan,
        expiresAt,
        startedAt: new Date(),
        amountUsd: plan === "two_weeks" ? 3 : plan === "annual" ? 45 : 5,
        paymentReference: `ADMIN-${Date.now()}`,
      },
    });

    return res.status(200).json({ success: true, message: "Subscription activated." });
  } catch (error) {
    console.error("Admin activate subscription error:", error);
    return res.status(500).json({ success: false, error: "Failed to activate subscription." });
  }
});

// GET /api/admin/lessons
router.get("/lessons", async (req: AuthRequest, res: Response) => {
  try {
    const { topicId } = req.query;
    const where = topicId ? { topicId: String(topicId) } : {};

    const lessons = await prisma.lesson.findMany({
      where,
      orderBy: { orderIndex: "asc" },
      include: {
        topic: { select: { name: true, slug: true } },
      },
    });

    return res.status(200).json({ success: true, data: lessons });
  } catch (error) {
    console.error("Admin lessons error:", error);
    return res.status(500).json({ success: false, error: "Failed to load lessons." });
  }
});

// POST /api/admin/lessons
router.post("/lessons", async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      topicId: z.string().min(1, "Topic is required"),
      title: z.string().min(1, "Title is required"),
      content: z.string().min(1, "Content is required"),
      orderIndex: z.number().int().min(1),
      isFree: z.boolean().default(false),
      estimatedMinutes: z.number().int().min(1).default(10),
      videoUrl: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    const lesson = await prisma.lesson.create({ data: parsed.data });

    return res.status(201).json({ success: true, data: lesson });
  } catch (error) {
    console.error("Admin create lesson error:", error);
    return res.status(500).json({ success: false, error: "Failed to create lesson." });
  }
});

// PUT /api/admin/lessons/:id
router.put("/lessons/:id", async (req: AuthRequest, res: Response) => {
  try {
    const lesson = await prisma.lesson.update({
      where: { id: String(req.params.id) },
      data: req.body,
    });

    return res.status(200).json({ success: true, data: lesson });
  } catch (error) {
    console.error("Admin update lesson error:", error);
    return res.status(500).json({ success: false, error: "Failed to update lesson." });
  }
});

// DELETE /api/admin/lessons/:id
router.delete("/lessons/:id", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.lesson.delete({ where: { id: String(req.params.id) } });
    return res.status(200).json({ success: true, message: "Lesson deleted." });
  } catch (error) {
    console.error("Admin delete lesson error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete lesson." });
  }
});

export default router;