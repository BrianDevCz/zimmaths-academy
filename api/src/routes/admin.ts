import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/admin/stats
router.get("/stats", async (req: AuthRequest, res: Response) => {
  try {
    const [
      totalUsers, totalPapers, totalQuestions, activeSubscriptions,
      totalRevenue, recentUsers, totalPracticeTests, totalPointsAwarded,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.paper.count(),
      prisma.question.count(),
      prisma.subscription.count({ where: { status: "active" } }),
      prisma.subscription.aggregate({ where: { status: "active" }, _sum: { amountUsd: true } }),
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
        take: 10,
        select: { id: true, name: true, email: true, grade: true, createdAt: true, role: true },
      }),
      prisma.practiceTest.count(),
      prisma.userPoint.aggregate({ _sum: { points: true } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalUsers, totalPapers, totalQuestions, activeSubscriptions,
        totalRevenue: totalRevenue._sum.amountUsd || 0,
        recentUsers, totalPracticeTests,
        totalPointsAwarded: totalPointsAwarded._sum.points || 0,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return res.status(500).json({ success: false, error: "Failed to load stats." });
  }
});

// GET /api/admin/users — with search and pagination
router.get("/users", async (req: AuthRequest, res: Response) => {
  try {
    const { search, page } = req.query;
    const pageNum = Math.max(0, parseInt(String(page || "0")));
    const pageSize = 50;

    const where: any = search
      ? {
          OR: [
            { name: { contains: String(search), mode: "insensitive" } },
            { email: { contains: String(search), mode: "insensitive" } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: pageNum * pageSize,
        select: {
          id: true, name: true, email: true, grade: true, role: true,
          createdAt: true, lastActive: true,
          subscription: { select: { status: true, plan: true, expiresAt: true } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return res.status(200).json({
      success: true, data: users, total, page: pageNum,
      pageSize, totalPages: Math.ceil(total / pageSize),
    });
  } catch (error) {
    console.error("Admin users error:", error);
    return res.status(500).json({ success: false, error: "Failed to load users." });
  }
});

// PUT /api/admin/users/:id/role
router.put("/users/:id/role", async (req: AuthRequest, res: Response) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) return res.status(400).json({ success: false, error: "Invalid role." });
    const user = await prisma.user.update({ where: { id: String(req.params.id) }, data: { role } });
    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    console.error("Admin update role error:", error);
    return res.status(500).json({ success: false, error: "Failed to update role." });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req: AuthRequest, res: Response) => {
  try {
    const userId = String(req.params.id);

    // Prevent deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({ success: false, error: "You cannot delete your own account." });
    }

    // Check user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    // Prevent deleting other admins
    if (user.role === "admin") {
      return res.status(400).json({ success: false, error: "Cannot delete an admin account." });
    }

    // Delete related data first to avoid FK constraint errors
    await prisma.userPoint.deleteMany({ where: { userId } });
    await prisma.userBadge.deleteMany({ where: { userId } });
    await prisma.bookmark.deleteMany({ where: { userId } });
    await prisma.userLessonProgress.deleteMany({ where: { userId } });
    await prisma.dailyChallengeAttempt.deleteMany({ where: { userId } });
    await prisma.practiceTest.deleteMany({ where: { userId } });
    await prisma.aiChatUsage.deleteMany({ where: { userId } });
    await prisma.subscription.deleteMany({ where: { userId } });
    await prisma.user.delete({ where: { id: userId } });

    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    console.error("Admin delete user error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete user." });
  }
});

// GET /api/admin/papers
router.get("/papers", async (req: AuthRequest, res: Response) => {
  try {
    const papers = await prisma.paper.findMany({
      orderBy: { title: "asc" },
      include: { _count: { select: { questions: true } } },
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
      isFree: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    const paper = await prisma.paper.create({ data: parsed.data });
    return res.status(201).json({ success: true, data: paper });
  } catch (error) {
    console.error("Admin create paper error:", error);
    return res.status(500).json({ success: false, error: "Failed to create paper." });
  }
});

// PUT /api/admin/papers/:id
router.put("/papers/:id", async (req: AuthRequest, res: Response) => {
  try {
    const paper = await prisma.paper.update({ where: { id: String(req.params.id) }, data: req.body });
    return res.status(200).json({ success: true, data: paper });
  } catch (error) {
    console.error("Admin update paper error:", error);
    return res.status(500).json({ success: false, error: "Failed to update paper." });
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
    const { paperId, practiceOnly } = req.query;
    let where: any = {};
    if (paperId) where.paperId = String(paperId);
    else if (practiceOnly === "true") where.paperId = null;

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
      paperId: z.string().optional().nullable(),
      topicId: z.string().min(1, "Topic is required"),
      questionNumber: z.number().int().min(1),
      questionText: z.string().min(1, "Question text is required"),
      marks: z.number().int().min(1),
      difficulty: z.enum(["easy", "medium", "hard"]),
      correctAnswer: z.string().optional(),
      solutionText: z.string().optional(),
      solutionSteps: z.any().optional(),
      questionImageUrl: z.string().optional(),
      isFree: z.boolean().default(false),
      isDailyEligible: z.boolean().default(false),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    const data = { ...parsed.data, paperId: parsed.data.paperId || null };
    const question = await prisma.question.create({ data: data as any });
    return res.status(201).json({ success: true, data: question });
  } catch (error) {
    console.error("Admin create question error:", error);
    return res.status(500).json({ success: false, error: "Failed to create question." });
  }
});

// POST /api/admin/questions/import
router.post("/questions/import", async (req: AuthRequest, res: Response) => {
  try {
    const { questions } = req.body;
    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, error: "No questions provided." });
    }

    const results = { imported: 0, failed: 0, errors: [] as string[] };

    for (const q of questions) {
      try {
        const topic = await prisma.topic.findUnique({ where: { slug: q.topicSlug } });
        if (!topic) {
          results.failed++;
          results.errors.push(`Q${q.questionNumber}: Topic "${q.topicSlug}" not found`);
          continue;
        }

        let paperId = null;
        if (q.paperTitle && q.paperTitle.trim()) {
          const paper = await prisma.paper.findFirst({ where: { title: { contains: q.paperTitle.trim() } } });
          if (!paper) {
            results.failed++;
            results.errors.push(`Q${q.questionNumber}: Paper "${q.paperTitle}" not found`);
            continue;
          }
          paperId = paper.id;
        }

        await prisma.question.create({
          data: {
            topicId: topic.id, paperId,
            questionNumber: parseInt(q.questionNumber),
            questionText: q.questionText,
            marks: parseInt(q.marks),
            difficulty: q.difficulty || "medium",
            correctAnswer: q.correctAnswer || "",
            solutionText: q.solutionText || "",
            isFree: q.isFree === "true" || q.isFree === true,
            isDailyEligible: q.isDailyEligible === "true" || q.isDailyEligible === true,
            questionImageUrl: q.questionImageUrl || null,
          },
        });
        results.imported++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Q${q.questionNumber}: Failed to import`);
      }
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Batch import error:", error);
    return res.status(500).json({ success: false, error: "Batch import failed." });
  }
});

// PUT /api/admin/questions/:id
router.put("/questions/:id", async (req: AuthRequest, res: Response) => {
  try {
    const question = await prisma.question.update({ where: { id: String(req.params.id) }, data: req.body });
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
      include: { user: { select: { name: true, email: true, grade: true } } },
    });
    return res.status(200).json({ success: true, data: subscriptions });
  } catch (error) {
    console.error("Admin subscriptions error:", error);
    return res.status(500).json({ success: false, error: "Failed to load subscriptions." });
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
        userId: String(req.params.userId), status: "active", plan, expiresAt,
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

// PUT /api/admin/subscriptions/:userId/cancel
router.put("/subscriptions/:userId/cancel", async (req: AuthRequest, res: Response) => {
  try {
    await prisma.subscription.update({ where: { userId: String(req.params.userId) }, data: { status: "cancelled" } });
    return res.status(200).json({ success: true, message: "Subscription cancelled." });
  } catch (error) {
    console.error("Admin cancel subscription error:", error);
    return res.status(500).json({ success: false, error: "Failed to cancel subscription." });
  }
});

// GET /api/admin/lessons
router.get("/lessons", async (req: AuthRequest, res: Response) => {
  try {
    const { topicId } = req.query;
    const where = topicId ? { topicId: String(topicId) } : {};
    const lessons = await prisma.lesson.findMany({
      where, orderBy: { orderIndex: "asc" },
      include: { topic: { select: { name: true, slug: true } } },
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
      geogebraUrl: z.string().optional(),
      imageUrl: z.string().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
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
    const lesson = await prisma.lesson.update({ where: { id: String(req.params.id) }, data: req.body });
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

// ── Daily Challenge Admin Routes ──────────────────────────────

router.get("/daily-challenges", async (req: AuthRequest, res: Response) => {
  try {
    const challenges = await prisma.dailyChallenge.findMany({
      orderBy: { date: "desc" }, take: 60,
      include: { question: { include: { topic: { select: { name: true } } } } },
    });
    return res.status(200).json({ success: true, data: challenges });
  } catch (error) {
    console.error("Admin daily challenges error:", error);
    return res.status(500).json({ success: false, error: "Failed to load daily challenges." });
  }
});

router.get("/daily-eligible-questions", async (req: AuthRequest, res: Response) => {
  try {
    const questions = await prisma.question.findMany({
      where: { isDailyEligible: true }, orderBy: { questionNumber: "asc" },
      include: { topic: { select: { name: true } } },
    });
    return res.status(200).json({ success: true, data: questions });
  } catch (error) {
    console.error("Admin eligible questions error:", error);
    return res.status(500).json({ success: false, error: "Failed to load eligible questions." });
  }
});

router.post("/daily-challenges", async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      questionId: z.string().min(1, "Question is required"),
      date: z.string().min(1, "Date is required"),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ success: false, error: parsed.error.issues[0].message });

    const dateObj = new Date(parsed.data.date);
    dateObj.setHours(0, 0, 0, 0);

    const existing = await prisma.dailyChallenge.findFirst({
      where: { date: { gte: dateObj, lt: new Date(dateObj.getTime() + 24 * 60 * 60 * 1000) } },
    });
    if (existing) {
      return res.status(400).json({ success: false, error: `A challenge is already scheduled for ${parsed.data.date}. Delete it first.` });
    }

    const challenge = await prisma.dailyChallenge.create({
      data: { questionId: parsed.data.questionId, date: dateObj },
      include: { question: { include: { topic: { select: { name: true } } } } },
    });
    return res.status(201).json({ success: true, data: challenge });
  } catch (error) {
    console.error("Admin schedule challenge error:", error);
    return res.status(500).json({ success: false, error: "Failed to schedule challenge." });
  }
});

router.delete("/daily-challenges/:id", async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    await prisma.dailyChallengeAttempt.deleteMany({ where: { dailyChallengeId: id } });
    await prisma.dailyChallenge.delete({ where: { id } });
    return res.status(200).json({ success: true, message: "Challenge deleted." });
  } catch (error) {
    console.error("Admin delete challenge error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete challenge." });
  }
});

// ── Analytics ─────────────────────────────────────────────────

router.get("/analytics", async (req: AuthRequest, res: Response) => {
  try {
    const days = 30;
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const [registrations, subscriptions, practiceTests, topicPopularity, planBreakdown] = await Promise.all([
      prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true }, orderBy: { createdAt: "asc" } }),
      prisma.subscription.findMany({ where: { startedAt: { gte: since }, status: "active" }, select: { startedAt: true, amountUsd: true, plan: true }, orderBy: { startedAt: "asc" } }),
      prisma.practiceTest.findMany({ where: { completedAt: { gte: since } }, select: { completedAt: true, scorePercentage: true }, orderBy: { completedAt: "asc" } }),
      prisma.practiceTest.groupBy({ by: ["topicId"], _count: { topicId: true }, orderBy: { _count: { topicId: "desc" } }, take: 10 }),
      prisma.subscription.groupBy({ by: ["plan"], where: { status: "active" }, _count: { plan: true } }),
    ]);

    const topicIds = topicPopularity.map((t) => t.topicId).filter(Boolean) as string[];
    const topicNames = await prisma.topic.findMany({ where: { id: { in: topicIds } }, select: { id: true, name: true, icon: true } });
    const topicMap = new Map(topicNames.map((t) => [t.id, t]));
    const topicStats = topicPopularity.filter((t) => t.topicId).map((t) => ({
      topicId: t.topicId,
      name: topicMap.get(t.topicId!)?.name || "Unknown",
      icon: topicMap.get(t.topicId!)?.icon || "",
      count: t._count.topicId,
    }));

    const dateMap: { [date: string]: { registrations: number; subscriptions: number; revenue: number; tests: number } } = {};
    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      const key = d.toISOString().split("T")[0];
      dateMap[key] = { registrations: 0, subscriptions: 0, revenue: 0, tests: 0 };
    }

    for (const r of registrations) { const key = new Date(r.createdAt).toISOString().split("T")[0]; if (dateMap[key]) dateMap[key].registrations++; }
    for (const s of subscriptions) { const key = new Date(s.startedAt).toISOString().split("T")[0]; if (dateMap[key]) { dateMap[key].subscriptions++; dateMap[key].revenue += s.amountUsd || 0; } }
    for (const t of practiceTests) { const key = new Date(t.completedAt).toISOString().split("T")[0]; if (dateMap[key]) dateMap[key].tests++; }

    const daily = Object.entries(dateMap).map(([date, values]) => ({ date, ...values }));
    const totalNewUsers = registrations.length;
    const totalNewSubs = subscriptions.length;
    const totalNewRevenue = subscriptions.reduce((sum, s) => sum + (s.amountUsd || 0), 0);
    const totalNewTests = practiceTests.length;
    const avgScore = practiceTests.length > 0 ? Math.round(practiceTests.reduce((sum, t) => sum + t.scorePercentage, 0) / practiceTests.length) : 0;

    return res.status(200).json({
      success: true,
      data: { daily, topicStats, summary: { totalNewUsers, totalNewSubs, totalNewRevenue, totalNewTests, avgScore }, planBreakdown },
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return res.status(500).json({ success: false, error: "Failed to load analytics." });
  }
});

// ── Badges ────────────────────────────────────────────────────

router.get("/badges", async (req: AuthRequest, res: Response) => {
  try {
    const [badgeStats, recentBadges] = await Promise.all([
      prisma.userBadge.groupBy({ by: ["badgeSlug"], _count: { badgeSlug: true }, orderBy: { _count: { badgeSlug: "desc" } } }),
      prisma.userBadge.findMany({ orderBy: { awardedAt: "desc" }, take: 20, include: { user: { select: { name: true, email: true } } } }),
    ]);
    return res.status(200).json({ success: true, data: { badgeStats, recentBadges } });
  } catch (error) {
    console.error("Admin badges error:", error);
    return res.status(500).json({ success: false, error: "Failed to load badge stats." });
  }
});

export default router;
