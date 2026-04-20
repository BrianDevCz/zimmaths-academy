import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface BadgeDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
}

export const BADGES: BadgeDefinition[] = [
  {
    slug: 'first-step',
    name: 'First Step',
    description: 'Complete your first practice test',
    icon: '🎯',
  },
  {
    slug: 'on-a-roll',
    name: 'On a Roll',
    description: '7-day login streak',
    icon: '🔥',
  },
  {
    slug: 'unstoppable',
    name: 'Unstoppable',
    description: '30-day login streak',
    icon: '⚡',
  },
  {
    slug: 'daily-challenger',
    name: 'Daily Challenger',
    description: 'Attempt 30 daily challenges',
    icon: '📅',
  },
  {
    slug: 'perfect-score',
    name: 'Perfect Score',
    description: 'Score 100% on any 10-question practice test',
    icon: '💯',
  },
  {
    slug: 'algebra-ace',
    name: 'Algebra Ace',
    description: 'Score 90%+ on 3 Algebra practice tests',
    icon: '🔢',
  },
  {
    slug: 'probability-pro',
    name: 'Probability Pro',
    description: 'Score 90%+ on 3 Probability practice tests',
    icon: '🎲',
  },
  {
    slug: 'trig-master',
    name: 'Trig Master',
    description: 'Score 90%+ on 3 Trigonometry practice tests',
    icon: '📐',
  },
  {
    slug: 'topic-conqueror',
    name: 'Topic Conqueror',
    description: 'Complete all lessons in any 5 topics',
    icon: '🏅',
  },
  {
    slug: 'zimsec-ready',
    name: 'ZIMSEC Ready',
    description: 'Complete all lessons in all 15 topics',
    icon: '🎓',
  },
  {
    slug: 'top-10',
    name: 'Top 10',
    description: 'Reach top 10 on the weekly leaderboard',
    icon: '🏆',
  },
  {
    slug: 'champion',
    name: 'Champion',
    description: 'Reach #1 on the weekly leaderboard',
    icon: '👑',
  },
  {
    slug: 'social-learner',
    name: 'Social Learner',
    description: 'Share 20 questions to WhatsApp',
    icon: '📤',
  },
  {
    slug: 'problem-solver',
    name: 'Problem Solver',
    description: 'Attempt 200 practice questions',
    icon: '🧠',
  },
];

// Award a badge if not already earned
async function awardBadge(userId: string, badgeSlug: string): Promise<boolean> {
  const existing = await prisma.userBadge.findFirst({
    where: { userId, badgeSlug },
  });
  if (existing) return false;

  await prisma.userBadge.create({
    data: { userId, badgeSlug },
  });

  console.log(`🏅 Badge awarded: ${badgeSlug} to user ${userId}`);
  return true;
}

// Check and award all applicable badges after a practice test
export async function checkBadgesAfterPracticeTest(
  userId: string,
  scorePercentage: number,
  questionCount: number,
  topicSlug?: string | null
): Promise<string[]> {
  const awarded: string[] = [];

  try {
    // First Step — complete first practice test
    const testCount = await prisma.practiceTest.count({ where: { userId } });
    if (testCount >= 1) {
      if (await awardBadge(userId, 'first-step')) awarded.push('first-step');
    }

    // Perfect Score — 100% on 10-question test
    if (scorePercentage === 100 && questionCount >= 10) {
      if (await awardBadge(userId, 'perfect-score')) awarded.push('perfect-score');
    }

    // Problem Solver — attempt 200 practice questions
    const totalQuestions = await prisma.practiceTest.aggregate({
      where: { userId },
      _sum: { questionCount: true },
    });
    if ((totalQuestions._sum.questionCount || 0) >= 200) {
      if (await awardBadge(userId, 'problem-solver')) awarded.push('problem-solver');
    }

    // Topic-specific badges (90%+ on 3 tests)
    if (topicSlug && scorePercentage >= 90) {
      const topicTests = await prisma.practiceTest.count({
        where: {
          userId,
          scorePercentage: { gte: 90 },
          topic: { slug: topicSlug },
        },
      });

      if (topicSlug === 'algebra' && topicTests >= 3) {
        if (await awardBadge(userId, 'algebra-ace')) awarded.push('algebra-ace');
      }
      if (topicSlug === 'probability' && topicTests >= 3) {
        if (await awardBadge(userId, 'probability-pro')) awarded.push('probability-pro');
      }
      if (topicSlug === 'trigonometry' && topicTests >= 3) {
        if (await awardBadge(userId, 'trig-master')) awarded.push('trig-master');
      }
    }
  } catch (error) {
    console.error('Badge check error (practice):', error);
  }

  return awarded;
}

// Check and award badges after daily challenge attempt
export async function checkBadgesAfterDailyChallenge(userId: string): Promise<string[]> {
  const awarded: string[] = [];

  try {
    const attemptCount = await prisma.dailyChallengeAttempt.count({ where: { userId } });

    if (attemptCount >= 30) {
      if (await awardBadge(userId, 'daily-challenger')) awarded.push('daily-challenger');
    }
  } catch (error) {
    console.error('Badge check error (daily):', error);
  }

  return awarded;
}

// Check and award badges after lesson completion
export async function checkBadgesAfterLessonComplete(userId: string): Promise<string[]> {
  const awarded: string[] = [];

  try {
    // Get all topics and how many lessons each has
    const topics = await prisma.topic.findMany({
      include: {
        lessons: { select: { id: true } },
      },
    });

    // Get user's completed lessons
    const completedLessons = await prisma.userLessonProgress.findMany({
      where: { userId },
      select: { lessonId: true },
    });

    const completedIds = new Set(completedLessons.map((l) => l.lessonId));

    // Count how many topics the user has fully completed
    let completedTopics = 0;
    for (const topic of topics) {
      const topicLessonIds = topic.lessons.map((l) => l.id);
      if (topicLessonIds.length > 0 && topicLessonIds.every((id) => completedIds.has(id))) {
        completedTopics++;
      }
    }

    // Topic Conqueror — complete all lessons in 5 topics
    if (completedTopics >= 5) {
      if (await awardBadge(userId, 'topic-conqueror')) awarded.push('topic-conqueror');
    }

    // ZIMSEC Ready — complete all lessons in all 15 topics
    if (completedTopics >= 15) {
      if (await awardBadge(userId, 'zimsec-ready')) awarded.push('zimsec-ready');
    }
  } catch (error) {
    console.error('Badge check error (lesson):', error);
  }

  return awarded;
}

// Check and award streak badges
export async function checkBadgesAfterLogin(userId: string, streakCount: number): Promise<string[]> {
  const awarded: string[] = [];

  try {
    if (streakCount >= 7) {
      if (await awardBadge(userId, 'on-a-roll')) awarded.push('on-a-roll');
    }
    if (streakCount >= 30) {
      if (await awardBadge(userId, 'unstoppable')) awarded.push('unstoppable');
    }
  } catch (error) {
    console.error('Badge check error (login):', error);
  }

  return awarded;
}

// Check leaderboard badges
export async function checkLeaderboardBadges(userId: string, rank: number): Promise<string[]> {
  const awarded: string[] = [];

  try {
    if (rank <= 10) {
      if (await awardBadge(userId, 'top-10')) awarded.push('top-10');
    }
    if (rank === 1) {
      if (await awardBadge(userId, 'champion')) awarded.push('champion');
    }
  } catch (error) {
    console.error('Badge check error (leaderboard):', error);
  }

  return awarded;
}

// Get all badges for a user with earned status
export async function getUserBadges(userId: string) {
  const earned = await prisma.userBadge.findMany({
    where: { userId },
    select: { badgeSlug: true, awardedAt: true },
  });

  const earnedMap = new Map(earned.map((b) => [b.badgeSlug, b.awardedAt]));

  return BADGES.map((badge) => ({
    ...badge,
    earned: earnedMap.has(badge.slug),
    awardedAt: earnedMap.get(badge.slug) || null,
  }));
}
