import { Router, Response } from "express";
import prisma from '../lib/prisma';
import { AuthRequest } from "../middleware/auth";
import { getUserTotalPoints, getUserWeeklyPoints } from "../points";

const router = Router();

// GET /api/dashboard
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Run all queries in parallel for speed
    const [
      user,
      practiceTests,
      totalPoints,
      weeklyPoints,
      recentPoints,
    ] = await Promise.all([
      // User info
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          grade: true,
          avatarColour: true,
          createdAt: true,
        },
      }),

      // All practice tests
      prisma.practiceTest.findMany({
        where: { userId },
        orderBy: { completedAt: "desc" },
        take: 50,
      }),

      // Total points
      getUserTotalPoints(userId),

      // Weekly points
      getUserWeeklyPoints(userId),

      // Recent point transactions
      prisma.userPoint.findMany({
        where: { userId },
        orderBy: { awardedAt: "desc" },
        take: 10,
      }),
    ]);

    // Calculate topic performance from practice tests
    const topicScores: Record<string, { correct: number; total: number }> = {};

    for (const test of practiceTests) {
      const questions = (test.questionsData as any[]) || [];
      for (const q of questions) {
        const topic = q.topic || "Unknown";
        if (!topicScores[topic]) {
          topicScores[topic] = { correct: 0, total: 0 };
        }
        topicScores[topic].total += 1;
        if (q.isCorrect) topicScores[topic].correct += 1;
      }
    }

    // Build topic performance array
    const topicPerformance = Object.entries(topicScores).map(
      ([topic, scores]) => ({
        topic,
        correct: scores.correct,
        total: scores.total,
        percentage:
          scores.total > 0
            ? Math.round((scores.correct / scores.total) * 100)
            : 0,
      })
    ).sort((a, b) => b.total - a.total);

    // Identify weak topics (below 60%)
    const weakTopics = topicPerformance
      .filter((t) => t.percentage < 60 && t.total >= 2)
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 3);

    // Score trend — last 10 tests
    const scoreTrend = practiceTests.slice(0, 10).reverse().map((t) => ({
      date: t.completedAt,
      score: t.scorePercentage,
      topic: "Mixed",
    }));

    // Weekly rank
    let weeklyRank = null;
    const weeklyBoard = await prisma.userPoint.groupBy({
      by: ["userId"],
      where: {
        awardedAt: {
          gte: (() => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay() + 1);
            d.setHours(0, 0, 0, 0);
            return d;
          })(),
        },
      },
      _sum: { points: true },
      orderBy: { _sum: { points: "desc" } },
    });

    const myRankIndex = weeklyBoard.findIndex((u) => u.userId === userId);
    weeklyRank = myRankIndex !== -1 ? myRankIndex + 1 : weeklyBoard.length + 1;

    // Tests completed stats
    const testsCompleted = practiceTests.length;
    const averageScore =
      testsCompleted > 0
        ? Math.round(
            practiceTests.reduce((sum, t) => sum + t.scorePercentage, 0) /
              testsCompleted
          )
        : 0;

    return res.status(200).json({
      success: true,
      data: {
        user,
        stats: {
          totalPoints,
          weeklyPoints,
          weeklyRank,
          testsCompleted,
          averageScore,
        },
        topicPerformance,
        weakTopics,
        scoreTrend,
        recentActivity: recentPoints,
        practiceHistory: practiceTests.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load dashboard.",
    });
  }
});

export default router;