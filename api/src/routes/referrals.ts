import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// Reward tier configuration
const REWARD_TIERS = [
  { id: "tier_5", threshold: 5, months: 1, label: "1 Month Free Premium" },
  { id: "tier_10", threshold: 10, months: 3, label: "3 Months Free Premium" },
  { id: "tier_30", threshold: 30, months: 12, label: "1 Year Free Premium" },
];

// GET /api/referrals/me — Get current user's referral dashboard data
router.get("/me", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    // Get user with referral code
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, referralCode: true, name: true },
    });

    if (!user) return res.status(404).json({ error: "User not found" });

    // Get all referrals made by this user
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            name: true,
            createdAt: true,
            subscription: {
              select: { status: true, plan: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Count paid referrals (referred users with active premium subscription)
    const paidReferrals = referrals.filter(
      (r) => r.referred.subscription?.status === "active"
    );

    // Get claimed rewards
    const claimedRewards = await prisma.referralReward.findMany({
      where: { userId },
      orderBy: { claimedAt: "desc" },
    });

    const claimedTierIds = claimedRewards.map((r) => r.tier);

    // Build reward tiers with status
    const rewardTiers = REWARD_TIERS.map((tier) => ({
      ...tier,
      unlocked: paidReferrals.length >= tier.threshold,
      claimed: claimedTierIds.includes(tier.id),
      remaining: Math.max(tier.threshold - paidReferrals.length, 0),
    }));

    // Format referral list
    const referralList = referrals.map((r) => ({
      id: r.id,
      name: r.referred.name,
      joinedAt: r.createdAt,
      status: r.referred.subscription?.status === "active" ? "premium" : "free",
    }));

    const referralLink = `https://zimmaths.com/register?ref=${user.referralCode}`;

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralLink,
        totalReferrals: referrals.length,
        paidReferrals: paidReferrals.length,
        referrals: referralList,
        rewardTiers,
        claimedRewards,
      },
    });
  } catch (error) {
    console.error("Referral dashboard error:", error);
    res.status(500).json({ error: "Failed to load referral data" });
  }
});

// POST /api/referrals/claim — Claim a reward tier
router.post("/claim", async (req: Request, res: Response) => {
  try {
    const userId = (req as any).userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { tierId } = req.body;
    if (!tierId) return res.status(400).json({ error: "tierId is required" });

    // Find the tier
    const tier = REWARD_TIERS.find((t) => t.id === tierId);
    if (!tier) return res.status(400).json({ error: "Invalid tier" });

    // Check if already claimed
    const existingClaim = await prisma.referralReward.findFirst({
      where: { userId, tier: tierId },
    });
    if (existingClaim) {
      return res.status(400).json({ error: "Reward already claimed" });
    }

    // Count paid referrals
    const paidCount = await prisma.referral.count({
      where: {
        referrerId: userId,
        referred: {
          subscription: { status: "active" },
        },
      },
    });

    if (paidCount < tier.threshold) {
      return res.status(400).json({
        error: `Need ${tier.threshold} paid referrals. You have ${paidCount}.`,
      });
    }

    // Create the reward record
    const reward = await prisma.referralReward.create({
      data: {
        userId,
        tier: tierId,
        paidReferrals: paidCount,
        rewardMonths: tier.months,
      },
    });

    // Apply the reward — extend or create subscription
    const now = new Date();
    const existingSub = await prisma.subscription.findUnique({
      where: { userId },
    });

    if (existingSub && existingSub.status === "active") {
      // Extend existing subscription
      const currentExpiry = new Date(existingSub.expiresAt);
      const baseDate = currentExpiry > now ? currentExpiry : now;
      const newExpiry = new Date(baseDate);
      newExpiry.setMonth(newExpiry.getMonth() + tier.months);

      await prisma.subscription.update({
        where: { userId },
        data: { expiresAt: newExpiry },
      });
    } else {
      // Create new subscription
      const expiresAt = new Date(now);
      expiresAt.setMonth(expiresAt.getMonth() + tier.months);

      await prisma.subscription.upsert({
        where: { userId },
        create: {
          userId,
          plan: "premium",
          status: "active",
          startedAt: now,
          expiresAt,
          paymentReference: `referral_${reward.id}`,
          amountUsd: 0,
        },
        update: {
          plan: "premium",
          status: "active",
          startedAt: now,
          expiresAt,
          paymentReference: `referral_${reward.id}`,
        },
      });
    }

    // Mark reward as applied
    await prisma.referralReward.update({
      where: { id: reward.id },
      data: { applied: true },
    });

    // Award bonus points
    await prisma.userPoint.create({
      data: {
        userId,
        points: tier.threshold * 10,
        source: "referral_reward",
        sourceId: reward.id,
      },
    });

    res.json({
      success: true,
      data: {
        reward,
        message: `${tier.label} has been applied to your account!`,
      },
    });
  } catch (error) {
    console.error("Claim reward error:", error);
    res.status(500).json({ error: "Failed to claim reward" });
  }
});

// GET /api/referrals/validate/:code — Validate a referral code (used at registration)
router.get("/validate/:code", async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const referrer = await prisma.user.findUnique({
      where: { referralCode: String(code).toUpperCase() },
      select: { id: true, name: true },
    });

    if (!referrer) {
      return res.json({ success: false, error: "Invalid referral code" });
    }

    res.json({
      success: true,
      data: { referrerName: referrer.name },
    });
  } catch (error) {
    console.error("Validate referral error:", error);
    res.status(500).json({ error: "Failed to validate code" });
  }
});

export default router;
