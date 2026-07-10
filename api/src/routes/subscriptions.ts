import { Router, Response, Request } from "express";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
import prisma from "../lib/prisma";
import { markReferralAsPaid } from "./referralHelpers";
const { Paynow } = require("paynow");

const router = Router();

// Initialize Paynow
const PAYNOW_RESULT_URL = process.env.PAYNOW_RESULT_URL || "https://zimmaths-academy-production.up.railway.app/api/subscriptions/paynow-webhook";
const PAYNOW_RETURN_URL = process.env.PAYNOW_RETURN_URL || "https://zimmaths.com/payment/success";

const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID,
  process.env.PAYNOW_INTEGRATION_KEY,
  PAYNOW_RESULT_URL,
  PAYNOW_RETURN_URL
);

const plans: Record<string, { label: string; price: number; days: number }> = {
  two_weeks: { label: "2 Weeks", price: 3, days: 14 },
  monthly: { label: "1 Month", price: 5, days: 30 },
  annual: { label: "1 Year", price: 45, days: 365 },
};

// ── Constants ─────────────────────────────────
const GRACE_PERIOD_DAYS = 3;

// ── Notification Service ─────────────────────────────────
async function sendSubscriptionNotification(
  userId: string,
  type: 'expiring_soon' | 'expired_grace' | 'paused' | 'resumed' | 'payment_failed',
  data: any
) {
  try {
    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, phone: true, name: true }
    });

    if (!user) {
      console.log(`User ${userId} not found for notification`);
      return;
    }

    // Notification messages
    const messages = {
      expiring_soon: {
        subject: '⚠️ Your ZimMaths Premium subscription is expiring soon!',
        body: `Hello ${user.name || 'there'}, your ZimMaths Premium subscription will expire in ${data.daysLeft} days. Renew now to continue enjoying premium features!`
      },
      expired_grace: {
        subject: '⏰ Your ZimMaths Premium subscription has entered grace period',
        body: `Hello ${user.name || 'there'}, your subscription expired ${data.daysOverdue} days ago. You have ${data.graceDaysLeft} days left in your grace period to renew without losing your premium status.`
      },
      paused: {
        subject: '⏸️ Your ZimMaths Premium subscription has been paused',
        body: `Hello ${user.name || 'there'}, your subscription has been paused because it expired ${data.daysOverdue} days ago. Renew now to resume your premium access!`
      },
      resumed: {
        subject: '▶️ Your ZimMaths Premium subscription has been resumed!',
        body: `Hello ${user.name || 'there'}, your subscription has been successfully renewed! Welcome back to ZimMaths Premium.`
      },
      payment_failed: {
        subject: '❌ Your ZimMaths Premium payment failed',
        body: `Hello ${user.name || 'there'}, we couldn't process your payment. Please try again or use a different payment method.`
      }
    };

    const message = messages[type];
    if (!message) return;
    
    // Send notification (implement your preferred method)
    // Example: Send email
    // await sendEmail(user.email, message.subject, message.body);
    
    // Example: Send SMS
    // await sendSMS(user.phone, message.body);
    
    // Log notification
    console.log(`📧 Notification sent to ${user.email}: ${message.subject}`);
    
    // Store notification in database for history
    try {
      await prisma.notification.create({
        data: {
          userId,
          type,
          subject: message.subject,
          body: message.body,
          data: data,
          sentAt: new Date()
        }
      });
    } catch (dbError) {
      // If notification table doesn't exist yet, just log it
      console.log('Notification stored in logs only (table may not exist):', dbError);
    }

  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

// ── Check and update expired subscriptions with grace period ─────────────────────────────────
async function updateExpiredSubscriptions() {
  try {
    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - GRACE_PERIOD_DAYS);
    
    // Find all active subscriptions that have expired but are still within grace period
    const expiringSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        expiresAt: { 
          lt: now,
          gt: gracePeriodEnd // Still within grace period
        }
      },
      include: {
        user: true
      }
    });

    // Find all active subscriptions that have passed the grace period
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        status: "active",
        expiresAt: { 
          lt: gracePeriodEnd // Past grace period
        }
      },
      include: {
        user: true
      }
    });

    // Send notifications for subscriptions in grace period
    for (const subscription of expiringSubscriptions) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(subscription.expiresAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );
      const graceDaysLeft = GRACE_PERIOD_DAYS - daysOverdue;

      // Only send if grace days left is 1 or 2 to avoid spam
      if (graceDaysLeft <= 2 && graceDaysLeft > 0) {
        await sendSubscriptionNotification(
          subscription.userId,
          'expired_grace',
          {
            daysOverdue,
            graceDaysLeft,
            plan: subscription.plan,
            expiresAt: subscription.expiresAt
          }
        );
      }
    }

    // Pause subscriptions that have passed the grace period
    for (const subscription of expiredSubscriptions) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(subscription.expiresAt).getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      // Pause the subscription
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { 
          status: "paused",
          pausedAt: now,
          gracePeriodEndedAt: now
        }
      });

      // Send pause notification
      await sendSubscriptionNotification(
        subscription.userId,
        'paused',
        {
          daysOverdue,
          plan: subscription.plan,
          expiredAt: subscription.expiresAt,
          pausedAt: now
        }
      );

      console.log(`⏸️ Subscription paused for user ${subscription.userId} after ${GRACE_PERIOD_DAYS} day grace period`);
    }

    // Check for subscriptions expiring soon (within 3 days)
    const threeDaysFromNow = new Date(now);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    
    const soonExpiring = await prisma.subscription.findMany({
      where: {
        status: "active",
        expiresAt: {
          gt: now,
          lt: threeDaysFromNow
        }
      },
      include: {
        user: true
      }
    });

    for (const subscription of soonExpiring) {
      const daysLeft = Math.ceil(
        (new Date(subscription.expiresAt).getTime() - now.getTime()) / 
        (1000 * 60 * 60 * 24)
      );

      await sendSubscriptionNotification(
        subscription.userId,
        'expiring_soon',
        {
          daysLeft,
          plan: subscription.plan,
          expiresAt: subscription.expiresAt
        }
      );
    }

    return {
      expiring: expiringSubscriptions.length,
      expired: expiredSubscriptions.length,
      soonExpiring: soonExpiring.length
    };
  } catch (error) {
    console.error("Error updating expired subscriptions:", error);
    return { expiring: 0, expired: 0, soonExpiring: 0 };
  }
}

// ── Schedule automatic expiration checks ─────────────────────────────────
// Run every hour
setInterval(async () => {
  const result = await updateExpiredSubscriptions();
  console.log(`🔄 Subscription check completed:`, result);
}, 60 * 60 * 1000);

// Run on server startup
updateExpiredSubscriptions();

// ── Resume subscription when payment is made ─────────────────────────────────
async function resumeSubscription(userId: string, paymentReference?: string) {
  try {
    const pausedSubscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: "paused"
      },
      orderBy: { expiresAt: "desc" }
    });

    if (pausedSubscription) {
      // Calculate new expiration date
      const planDetails = plans[pausedSubscription.plan as keyof typeof plans];
      const newExpiresAt = new Date();
      newExpiresAt.setDate(newExpiresAt.getDate() + planDetails.days);

      // Resume the subscription
      await prisma.subscription.update({
        where: { id: pausedSubscription.id },
        data: {
          status: "active",
          expiresAt: newExpiresAt,
          startedAt: new Date(),
          pausedAt: null,
          gracePeriodEndedAt: null,
          lastResumedAt: new Date()
        }
      });
      
      // Send resume notification
      await sendSubscriptionNotification(
        userId,
        'resumed',
        {
          plan: pausedSubscription.plan,
          expiresAt: newExpiresAt,
          daysUntilExpiry: planDetails.days
        }
      );
      
      console.log(`▶️ Subscription resumed for user ${userId}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error resuming subscription:", error);
    return false;
  }
}

// ── Helper — find subscription by reference string ─────────────────────────────────
async function findByReference(reference: string) {
  if (!reference) return null;

  const exact = await prisma.subscription.findFirst({
    where: { paymentReference: reference },
  });
  if (exact) return exact;

  const baseRef = reference.split("-").slice(0, 2).join("-");
  return await prisma.subscription.findFirst({
    where: { paymentReference: { startsWith: baseRef } },
  });
}

// ── Activate subscription by id ─────────────────────────────────
async function activateSubscription(id: string, userId: string, paymentReference?: string) {
  try {
    const existing = await prisma.subscription.findUnique({ where: { id } });
    
    // Check if subscription is already active
    if (existing?.status === "active") {
      console.log(`Subscription ${id} already active — skipping duplicate activation`);
      return;
    }

    // Check if user has a paused subscription
    const hasPaused = await resumeSubscription(userId, paymentReference);
    
    if (hasPaused) {
      console.log(`✅ Paused subscription resumed for user ${userId}`);
      return;
    }

    // If no paused subscription, create a new active subscription
    const planDetails = plans[existing?.plan as keyof typeof plans] || plans.monthly;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (planDetails.days || 30));

    await prisma.subscription.update({
      where: { id },
      data: { 
        status: "active",
        expiresAt: expiresAt,
        pausedAt: null,
        gracePeriodEndedAt: null,
        lastResumedAt: new Date()
      },
    });

    // Send activation notification
    await sendSubscriptionNotification(
      userId,
      'resumed',
      {
        plan: existing?.plan || 'monthly',
        expiresAt: expiresAt,
        daysUntilExpiry: planDetails.days
      }
    );

    // Mark referral as paid if this user was referred by someone
    await markReferralAsPaid(userId);

    console.log(`✅ New subscription activated for user ${userId}`);
  } catch (error) {
    console.error("Error activating subscription:", error);
    throw error;
  }
}

// ── Helper function to update individual user's subscriptions ─────────────────────────────────
async function updateUserSubscriptions(userId: string) {
  try {
    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - GRACE_PERIOD_DAYS);
    
    // Find all active subscriptions for this user that have passed grace period
    const expiredSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        status: "active",
        expiresAt: { lt: gracePeriodEnd }
      }
    });

    for (const subscription of expiredSubscriptions) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(subscription.expiresAt).getTime()) /
        (1000 * 60 * 60 * 24)
      );

      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { 
          status: "paused",
          pausedAt: now,
          gracePeriodEndedAt: now
        }
      });

      await sendSubscriptionNotification(
        userId,
        'paused',
        {
          daysOverdue,
          plan: subscription.plan,
          expiredAt: subscription.expiresAt
        }
      );
    }

    // Check for subscriptions in grace period to send reminders
    const graceSubscriptions = await prisma.subscription.findMany({
      where: {
        userId: userId,
        status: "active",
        expiresAt: {
          lt: now,
          gt: gracePeriodEnd
        }
      }
    });

    for (const subscription of graceSubscriptions) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(subscription.expiresAt).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      const graceDaysLeft = GRACE_PERIOD_DAYS - daysOverdue;

      // Send reminder only if grace days left is 1 or 2 (to avoid spam)
      if (graceDaysLeft <= 2 && graceDaysLeft > 0) {
        await sendSubscriptionNotification(
          userId,
          'expired_grace',
          {
            daysOverdue,
            graceDaysLeft,
            plan: subscription.plan,
            expiresAt: subscription.expiresAt
          }
        );
      }
    }
  } catch (error) {
    console.error(`Error updating subscriptions for user ${userId}:`, error);
  }
}

// ── DB-based lock — survives restarts & multiple instances ────────────────────
async function acquireLock(userId: string): Promise<boolean> {
  const tenSecondsAgo = new Date(Date.now() - 10000);
  const recentPending = await prisma.subscription.findFirst({
    where: {
      userId,
      status: "pending",
      startedAt: { gt: tenSecondsAgo },
    },
  });
  return !recentPending;
}

// ── Payment instructions helper ─────────────────────────────────
function getMobileInstructions(method: string, phone: string, amount: number): string {
  switch (method) {
    case "ecocash":
      return `A payment request of $${amount} USD has been sent to ${phone} via EcoCash. Check your phone and enter your EcoCash PIN to complete the payment.`;
    case "innbucks":
      return `A payment request of $${amount} USD has been sent to ${phone} via Innbucks. Check your phone and approve the payment.`;
    case "omari":
      return `You will be redirected to Paynow to complete your Omari wallet payment.`;
    default:
      return `Please complete your payment using ${method}.`;
  }
}

// ── Verify Paynow webhook hash ─────────────────────────────────
function verifyPaynowHash(body: any): boolean {
  const receivedHash = body.hash || "";
  if (!receivedHash) {
    console.warn("Paynow webhook: No hash in request body");
    return false;
  }

  const reference = body.reference || "";
  const amount = body.amount || "";
  const status = body.status || "";
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY || "";

  const crypto = require("crypto");
  const hashString = `${reference}${amount}${status}${integrationKey}`;
  const computedHash = crypto.createHash("sha512").update(hashString).digest("hex").toUpperCase();

  const valid = computedHash === receivedHash.toUpperCase();
  if (!valid) {
    console.warn("Paynow webhook: Hash verification failed");
  }
  return valid;
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

// GET /api/subscriptions/status
router.get("/status", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    // Check and update individual user's subscriptions
    await updateUserSubscriptions(req.userId);

    const now = new Date();
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - GRACE_PERIOD_DAYS);

    // Check for active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: "active",
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: "desc" },
    });

    // Check for subscription in grace period
    const graceSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: "active",
        expiresAt: {
          lt: now,
          gt: gracePeriodEnd
        }
      },
      orderBy: { expiresAt: "desc" },
    });

    // Check for paused subscription
    const pausedSubscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: "paused"
      },
      orderBy: { expiresAt: "desc" }
    });

    // Prepare response
    let statusResponse: any = {
      success: true,
      isPremium: !!subscription,
      isPaused: !!pausedSubscription,
      isInGracePeriod: !!graceSubscription,
    };

    if (subscription) {
      statusResponse.subscription = {
        plan: subscription.plan,
        expiresAt: subscription.expiresAt,
        daysLeft: Math.ceil(
          (new Date(subscription.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        ),
        status: 'active'
      };
    }

    if (graceSubscription) {
      const daysOverdue = Math.ceil(
        (now.getTime() - new Date(graceSubscription.expiresAt).getTime()) /
        (1000 * 60 * 60 * 24)
      );
      statusResponse.gracePeriod = {
        plan: graceSubscription.plan,
        expiredAt: graceSubscription.expiresAt,
        daysOverdue,
        graceDaysLeft: GRACE_PERIOD_DAYS - daysOverdue,
        expiresAt: new Date(new Date(graceSubscription.expiresAt).getTime() + GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000),
        status: 'in_grace_period'
      };
    }

    if (pausedSubscription) {
      statusResponse.pausedSubscription = {
        plan: pausedSubscription.plan,
        expiredAt: pausedSubscription.expiresAt,
        pausedAt: pausedSubscription.pausedAt,
        daysOverdue: Math.ceil(
          (now.getTime() - new Date(pausedSubscription.expiresAt).getTime()) /
          (1000 * 60 * 60 * 24)
        ),
        status: 'paused'
      };
    }

    return res.status(200).json(statusResponse);
  } catch (error) {
    console.error("Subscription status error:", error);
    return res.status(500).json({ success: false, error: "Failed to check subscription status." });
  }
});

// GET /api/subscriptions/status/:reference
router.get("/status/:reference", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const reference = String(req.params.reference || "");

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId, paymentReference: reference },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: "Payment reference not found." });
    }

    return res.status(200).json({
      success: true,
      status: subscription.status,
      isPremium: subscription.status === "active",
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    console.error("Status by reference error:", error);
    return res.status(500).json({ success: false, error: "Failed to check payment status." });
  }
});

// GET /api/subscriptions/poll-paynow
router.get("/poll-paynow", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const { pollUrl } = req.query;
    if (!pollUrl) {
      return res.status(400).json({ success: false, error: "Poll URL required." });
    }

    const status = await paynow.pollTransaction(String(pollUrl));
    console.log("Paynow poll result:", { paid: status.paid, status: status.status });

    if (status.paid || status.status?.toLowerCase() === "paid") {
      const subscription = await prisma.subscription.findFirst({
        where: { userId: req.userId },
        orderBy: { startedAt: "desc" },
      });

      if (subscription) {
        await activateSubscription(subscription.id, req.userId);
      }

      return res.status(200).json({
        success: true,
        paid: true,
        status: "paid",
        message: "Payment confirmed!",
      });
    }

    return res.status(200).json({
      success: true,
      paid: false,
      status: status.status || "pending",
    });
  } catch (error) {
    console.error("Poll Paynow error:", error);
    return res.status(500).json({ success: false, error: "Failed to check payment status." });
  }
});

// POST /api/subscriptions/initiate-paynow
router.post("/initiate-paynow", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    // DB-based lock — prevent double payments within 10 seconds
    const locked = await acquireLock(req.userId);
    if (!locked) {
      return res.status(429).json({
        success: false,
        error: "Payment already in progress. Please wait a moment.",
      });
    }

    const schema = z.object({
      plan: z.enum(["two_weeks", "monthly", "annual"]),
      paymentMethod: z.enum(["ecocash", "innbucks", "omari"]),
      phone: z.string().min(9, "Please enter a valid phone number"),
      email: z.string().email("Please enter a valid email address"),
      amount: z.number().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0].message });
    }

    const { plan, paymentMethod, phone, email } = parsed.data;
    const planDetails = plans[plan];

    // Check if user already has an active subscription
    const existingActive = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: "active",
        expiresAt: { gt: new Date() },
      },
    });

    if (existingActive) {
      return res.status(400).json({
        success: false,
        error: "You already have an active subscription.",
      });
    }

    // Check for a pending payment initiated in the last 2 minutes
    const recentPending = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
        status: "pending",
        startedAt: { gt: new Date(Date.now() - 2 * 60 * 1000) },
      },
    });

    if (recentPending) {
      return res.status(400).json({
        success: false,
        error: "A payment is already pending. Please complete or wait 2 minutes before trying again.",
      });
    }

    // Generate unique payment reference
    const paymentReference = `ZM-${Date.now()}-${req.userId.slice(0, 8).toUpperCase()}`;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDetails.days);

    // Upsert subscription
    await prisma.subscription.upsert({
      where: { userId: req.userId },
      update: {
        plan,
        status: "pending",
        startedAt: new Date(),
        expiresAt,
        paymentReference,
        amountUsd: planDetails.price,
      },
      create: {
        userId: req.userId,
        plan,
        status: "pending",
        startedAt: new Date(),
        expiresAt,
        paymentReference,
        amountUsd: planDetails.price,
      },
    });

    // Create Paynow payment
    const payment = paynow.createPayment(
      paymentReference,
      process.env.PAYNOW_MERCHANT_EMAIL || email
    );
    payment.add(`ZimMaths Premium — ${planDetails.label}`, planDetails.price);

    let response;
    if (paymentMethod === "ecocash") {
      response = await paynow.sendMobile(payment, phone, "ecocash");
    } else if (paymentMethod === "innbucks") {
      response = await paynow.sendMobile(payment, phone, "innbucks");
    } else {
      response = await paynow.send(payment);
    }

    console.log("Paynow response status:", response?.status);

    if (response && response.success) {
      return res.status(200).json({
        success: true,
        paymentRef: paymentReference,
        reference: paymentReference,
        pollUrl: response.pollUrl || null,
        redirectUrl: response.redirectUrl || null,
        plan: planDetails.label,
        amount: planDetails.price,
        paymentMethod,
        instructions: getMobileInstructions(paymentMethod, phone, planDetails.price),
      });
    } else {
      console.error("Paynow initiate error:", response);
      return res.status(400).json({
        success: false,
        error: response?.error || "Payment initiation failed. Please try again.",
      });
    }
  } catch (error) {
    console.error("Subscription initiate error:", error);
    return res.status(500).json({ success: false, error: "Failed to initiate payment. Please try again." });
  }
});

// POST /api/subscriptions/paynow-webhook
router.post("/paynow-webhook", async (req: Request, res: Response) => {
  try {
    // Verify this request came from Paynow
    if (!verifyPaynowHash(req.body)) {
      return res.status(403).send("Invalid signature");
    }
    console.log("Paynow webhook received:", { ref: req.body.reference, status: req.body.status });

    const reference = String(req.body.reference || "");
    const paynowreference = String(req.body.paynowreference || "");
    const status = String(req.body.status || req.body.paymentstatus || "");
    const paymentStatus = status.toLowerCase();

    console.log(`Webhook — Reference: ${reference}, Status: ${paymentStatus}`);

    if (paymentStatus === "paid") {
      const subscription = await findByReference(reference);
      if (subscription) {
        await activateSubscription(subscription.id, subscription.userId, reference);
      } else {
        console.warn("No subscription found for webhook reference:", reference, paynowreference);
      }
    } else if (["failed", "cancelled", "disputed"].includes(paymentStatus)) {
      const subscription = await findByReference(reference);
      if (subscription && subscription.status !== "active") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "failed" },
        });
        
        await sendSubscriptionNotification(
          subscription.userId,
          'payment_failed',
          {
            reference,
            status: paymentStatus,
            plan: subscription.plan
          }
        );
        
        console.log(`Payment ${paymentStatus} for reference ${reference}`);
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Paynow webhook error:", error);
    return res.status(500).send("Error");
  }
});

// POST /api/subscriptions/paynow-callback (alias)
router.post("/paynow-callback", async (req: Request, res: Response) => {
  try {
    // Verify this request came from Paynow
    if (!verifyPaynowHash(req.body)) {
      return res.status(403).send("Invalid signature");
    }
    console.log("Paynow callback received:", { ref: req.body?.reference });

    const reference = String(req.body.reference || "");
    const paynowreference = String(req.body.paynowreference || "");
    const status = String(req.body.status || "");
    const paymentStatus = status.toLowerCase();

    if (paymentStatus === "paid") {
      const subscription = await findByReference(reference);
      if (subscription) {
        await activateSubscription(subscription.id, subscription.userId, reference);
      } else {
        console.warn("No subscription found for callback reference:", reference, paynowreference);
      }
    } else if (["failed", "cancelled", "disputed"].includes(paymentStatus)) {
      const subscription = await findByReference(reference);
      if (subscription && subscription.status !== "active") {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: { status: "failed" },
        });
        
        await sendSubscriptionNotification(
          subscription.userId,
          'payment_failed',
          {
            reference,
            status: paymentStatus,
            plan: subscription.plan
          }
        );
        
        console.log(`Payment ${paymentStatus} for reference ${reference}`);
      }
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Paynow callback error:", error);
    return res.status(500).send("Error");
  }
});

// POST /api/subscriptions/confirm (manual admin activation)
router.post("/confirm", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.userId },
      orderBy: { startedAt: "desc" }
    });

    if (!subscription) {
      return res.status(404).json({ success: false, error: "No subscription found." });
    }

    await activateSubscription(subscription.id, req.userId);

    return res.status(200).json({
      success: true,
      message: "Subscription activated! Welcome to ZimMaths Premium!",
    });
  } catch (error) {
    console.error("Subscription confirm error:", error);
    return res.status(500).json({ success: false, error: "Failed to confirm payment." });
  }
});

// POST /api/subscriptions/check-subscription (manual check for current user)
router.post("/check-subscription", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const userId = req.userId;
    await updateUserSubscriptions(userId);
    
    // Get updated status
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: "active",
        expiresAt: { gt: new Date() }
      }
    });

    const paused = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        status: "paused"
      }
    });

    return res.status(200).json({
      success: true,
      message: "Subscription status updated",
      isActive: !!subscription,
      isPaused: !!paused,
      subscription: subscription ? {
        plan: subscription.plan,
        expiresAt: subscription.expiresAt,
        daysLeft: Math.ceil(
          (new Date(subscription.expiresAt).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
        )
      } : null
    });
  } catch (error) {
    console.error("Check subscription error:", error);
    return res.status(500).json({ success: false, error: "Failed to check subscription." });
  }
});

// POST /api/subscriptions/admin/manage (Admin only - manage any user's subscription)
// UPDATED: Now with case-insensitive admin check
router.post("/admin/manage", async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (!req.userId) {
      return res.status(401).json({ 
        success: false, 
        error: "Not authenticated" 
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { role: true }
    });

    // Case-insensitive admin check - this is the fix!
    const isAdminUser = user && user.role && user.role.toLowerCase() === 'admin';
    
    if (!isAdminUser) {
      console.log(`User ${req.userId} attempted admin action but role is ${user?.role}`);
      return res.status(403).json({ 
        success: false, 
        error: "Admin access required" 
      });
    }

    const { userId, action } = req.body;
    
    // Validate input
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "userId is required" 
      });
    }

    if (!['pause', 'resume'].includes(action)) {
      return res.status(400).json({ 
        success: false, 
        error: "action must be 'pause' or 'resume'" 
      });
    }

    // Find the target user's subscription
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true }
    });

    if (!targetUser) {
      return res.status(404).json({ 
        success: false, 
        error: "User not found" 
      });
    }

    // Execute the action
    if (action === 'pause') {
      // Only pause if subscription is active
      if (targetUser.subscription?.status !== 'active') {
        return res.status(400).json({ 
          success: false, 
          error: "User does not have an active subscription to pause" 
        });
      }

      await prisma.subscription.update({
        where: { userId: userId },
        data: { 
          status: "paused",
          pausedAt: new Date()
        }
      });
      
      return res.status(200).json({
        success: true,
        message: `Subscription paused successfully for ${targetUser.name}`
      });
    } 
    
    else if (action === 'resume') {
      // Only resume if subscription is paused
      if (targetUser.subscription?.status !== 'paused') {
        return res.status(400).json({ 
          success: false, 
          error: "User does not have a paused subscription to resume" 
        });
      }

      // Use the existing resumeSubscription function
      const resumed = await resumeSubscription(userId);
      
      if (!resumed) {
        return res.status(500).json({
          success: false,
          error: "Failed to resume subscription"
        });
      }
      
      return res.status(200).json({
        success: true,
        message: `Subscription resumed successfully for ${targetUser.name}`
      });
    }

    return res.status(400).json({
      success: false,
      error: "Invalid action"
    });
  } catch (error) {
    console.error("Admin manage error:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Failed to manage subscription. Please try again." 
    });
  }
});

export default router;