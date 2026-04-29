import prisma from "../lib/prisma";
import crypto from "crypto";

/**
 * Generate a unique, short referral code for a new user.
 * Format: First 4 chars of name (uppercase) + 4 random hex chars
 * Example: BRIA7F2A
 */
export function generateReferralCode(name: string): string {
  const prefix = name
    .replace(/[^a-zA-Z]/g, "")
    .slice(0, 4)
    .toUpperCase()
    .padEnd(4, "X");
  const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * Ensure referral code is unique, retry if collision
 */
export async function createUniqueReferralCode(name: string): Promise<string> {
  let code = generateReferralCode(name);
  let attempts = 0;

  while (attempts < 10) {
    const existing = await prisma.user.findUnique({
      where: { referralCode: code },
    });
    if (!existing) return code;
    code = generateReferralCode(name);
    attempts++;
  }

  // Fallback: use full random
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

/**
 * Record a referral after a new user registers.
 * Call this in your registration route AFTER the user is created.
 *
 * @param newUserId - The ID of the newly registered user
 * @param referralCode - The referral code from ?ref= query param
 */
export async function recordReferral(
  newUserId: string,
  referralCode: string
): Promise<boolean> {
  try {
    if (!referralCode) return false;

    // Find the referrer
    const referrer = await prisma.user.findUnique({
      where: { referralCode: referralCode.toUpperCase() },
      select: { id: true },
    });

    if (!referrer) return false;

    // Prevent self-referral
    if (referrer.id === newUserId) return false;

    // Check if referral already exists for this user
    const existing = await prisma.referral.findUnique({
      where: { referredId: newUserId },
    });
    if (existing) return false;

    // Create the referral record
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: newUserId,
        status: "registered",
      },
    });

    // Update the new user's referredBy field
    await prisma.user.update({
      where: { id: newUserId },
      data: { referredBy: referrer.id },
    });

    // Award points to referrer for the sign-up
    await prisma.userPoint.create({
      data: {
        userId: referrer.id,
        points: 5,
        source: "referral_signup",
        sourceId: newUserId,
      },
    });

    return true;
  } catch (error) {
    console.error("Record referral error:", error);
    return false;
  }
}

/**
 * Update referral status when a referred user upgrades to premium.
 * Call this in your payment/subscription route AFTER payment succeeds.
 *
 * @param userId - The ID of the user who just paid for premium
 */
export async function markReferralAsPaid(userId: string): Promise<void> {
  try {
    const referral = await prisma.referral.findUnique({
      where: { referredId: userId },
    });

    if (!referral || referral.status === "paid") return;

    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: "paid",
        convertedAt: new Date(),
      },
    });

    // Award bonus points to referrer for paid conversion
    await prisma.userPoint.create({
      data: {
        userId: referral.referrerId,
        points: 20,
        source: "referral_conversion",
        sourceId: userId,
      },
    });
  } catch (error) {
    console.error("Mark referral paid error:", error);
  }
}
