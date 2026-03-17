import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export type PointSource =
  | "practice_5q"
  | "practice_10q"
  | "practice_20q"
  | "practice_bonus_80"
  | "practice_bonus_100"
  | "daily_attempt"
  | "daily_correct"
  | "lesson_complete"
  | "topic_complete"
  | "streak_7"
  | "streak_30"
  | "whatsapp_share";

const POINT_VALUES: Record<PointSource, number> = {
  practice_5q: 10,
  practice_10q: 25,
  practice_20q: 55,
  practice_bonus_80: 15,
  practice_bonus_100: 30,
  daily_attempt: 5,
  daily_correct: 20,
  lesson_complete: 15,
  topic_complete: 50,
  streak_7: 50,
  streak_30: 200,
  whatsapp_share: 2,
};

export async function awardPoints(
  userId: string,
  source: PointSource,
  sourceId?: string
): Promise<number> {
  const points = POINT_VALUES[source];

  await prisma.userPoint.create({
    data: {
      userId,
      points,
      source,
      sourceId: sourceId || null,
    },
  });

  return points;
}

export async function getUserTotalPoints(userId: string): Promise<number> {
  const result = await prisma.userPoint.aggregate({
    where: { userId },
    _sum: { points: true },
  });
  return result._sum.points || 0;
}

export async function getUserWeeklyPoints(userId: string): Promise<number> {
  const monday = new Date();
  monday.setDate(monday.getDate() - monday.getDay() + 1);
  monday.setHours(0, 0, 0, 0);

  const result = await prisma.userPoint.aggregate({
    where: { userId, awardedAt: { gte: monday } },
    _sum: { points: true },
  });
  return result._sum.points || 0;
}