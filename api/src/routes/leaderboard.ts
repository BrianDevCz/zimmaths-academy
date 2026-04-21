import { Router, Response } from "express";
import { AuthRequest } from "../middleware/auth";
import prisma from "../lib/prisma";
import { checkLeaderboardBadges } from "../badges";

const router = Router();

// Simple in-memory cache — 5 minute TTL
const cache: { [key: string]: { data: any; timestamp: number } } = {};
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string) {
  const entry = cache[key];
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: any) {
  cache[key] = { data, timestamp: Date.now() };
}

function clearLeaderboardCache() {
  delete cache["weekly"];
  delete cache["monthly"];
  delete cache["alltime"];
}

// Helper — get top users by points
async function getTopUsers(period: "weekly" | "monthly" | "alltime", limit = 100) {
  const cached = getCached(period);
  if (cached) return cached;

  const now = new Date();
  let dateFilter: Date | null = null;

  if (period === "weekly") {
    const monday = new Date(now);
    monday.setDate(now.getDate() - now.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    dateFilter = monday;
  } else if (period === "monthly") {
    dateFilter = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const whereClause = dateFilter ? { awardedAt: { gte: dateFilter } } : {};

  const pointsData = await prisma.userPoint.groupBy({
    by: ["userId"],
    where: whereClause,
    _sum: { points: true },
    orderBy: { _sum: { points: "desc" } },
    take: limit,
  });

  const userIds = pointsData.map((p) => p.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, avatarColour: true, grade: true },
  });

  const userMap = new Map(users.map((u: any) => [u.id, u]));

  const result = pointsData.map((p, index) => ({
    rank: index + 1,
    userId: p.userId,
    name: userMap.get(p.userId)?.name || "Unknown",
    avatarColour: userMap.get(p.userId)?.avatarColour || "#1565C0",
    grade: userMap.get(p.userId)?.grade || "",
    points: p._sum.points || 0,
  }));

  setCache(period, result);
  return result;
}

// GET /api/leaderboard/weekly
router.get("/weekly", async (req: AuthRequest, res: Response) => {
  try {
    const board = await getTopUsers("weekly");

    let myRank = null;
    let badgesAwarded: string[] = [];

    if (req.userId) {
      const myIndex = board.findIndex((u: any) => u.userId === req.userId);

      if (myIndex !== -1) {
        const rank = myIndex + 1;
        myRank = { rank, points: board[myIndex].points };
        badgesAwarded = await checkLeaderboardBadges(req.userId, rank);
      } else {
        const now = new Date();
        const monday = new Date(now);
        monday.setDate(now.getDate() - now.getDay() + 1);
        monday.setHours(0, 0, 0, 0);

        const myPoints = await prisma.userPoint.aggregate({
          where: { userId: req.userId, awardedAt: { gte: monday } },
          _sum: { points: true },
        });

        const higherCount = await prisma.userPoint.groupBy({
          by: ["userId"],
          where: { awardedAt: { gte: monday } },
          _sum: { points: true },
          having: { points: { _sum: { gt: myPoints._sum.points || 0 } } },
        });

        myRank = { rank: higherCount.length + 1, points: myPoints._sum.points || 0 };
      }
    }

    return res.status(200).json({ success: true, period: "weekly", data: board, myRank, badgesAwarded });
  } catch (error) {
    console.error("Leaderboard error:", error);
    return res.status(500).json({ success: false, error: "Failed to load leaderboard." });
  }
});

// GET /api/leaderboard/monthly
router.get("/monthly", async (req: AuthRequest, res: Response) => {
  try {
    const board = await getTopUsers("monthly");
    let myRank = null;
    if (req.userId) {
      const myIndex = board.findIndex((u: any) => u.userId === req.userId);
      if (myIndex !== -1) myRank = { rank: myIndex + 1, points: board[myIndex].points };
    }
    return res.status(200).json({ success: true, period: "monthly", data: board, myRank });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load leaderboard." });
  }
});

// GET /api/leaderboard/alltime
router.get("/alltime", async (req: AuthRequest, res: Response) => {
  try {
    const board = await getTopUsers("alltime");
    let myRank = null;
    if (req.userId) {
      const myIndex = board.findIndex((u: any) => u.userId === req.userId);
      if (myIndex !== -1) myRank = { rank: myIndex + 1, points: board[myIndex].points };
    }
    return res.status(200).json({ success: true, period: "alltime", data: board, myRank });
  } catch (error) {
    return res.status(500).json({ success: false, error: "Failed to load leaderboard." });
  }
});

export default router;
