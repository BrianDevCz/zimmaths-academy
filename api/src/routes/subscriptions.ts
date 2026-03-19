import { Router, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";

const router = Router();
const prisma = new PrismaClient();

const plans = {
  two_weeks: { label: "2 Weeks", price: 3, days: 14 },
  monthly: { label: "1 Month", price: 5, days: 30 },
  annual: { label: "1 Year", price: 45, days: 365 },
};

// GET /api/subscriptions/status
router.get("/status", async (req: AuthRequest, res: Response) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId!,
        status: "active",
        expiresAt: { gt: new Date() },
      },
      orderBy: { expiresAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      isPremium: !!subscription,
      subscription: subscription
        ? {
            plan: subscription.plan,
            expiresAt: subscription.expiresAt,
            daysLeft: Math.ceil(
              (new Date(subscription.expiresAt).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            ),
          }
        : null,
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to check subscription status.",
    });
  }
});

// POST /api/subscriptions/initiate
router.post("/initiate", async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      plan: z.enum(["two_weeks", "monthly", "annual"]),
      paymentMethod: z.enum(["ecocash", "innbucks", "omari"]),
      phone: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.issues[0].message,
      });
    }

    const { plan, paymentMethod, phone } = parsed.data;
    const planDetails = plans[plan];

    // Generate unique payment reference
    const paymentReference = `ZM-${Date.now()}-${req.userId!.slice(0, 8).toUpperCase()}`;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDetails.days);

    // Create pending subscription
    // Upsert subscription — one record per user
await prisma.subscription.upsert({
  where: { userId: req.userId! },
  update: {
    plan,
    status: "pending",
    startedAt: new Date(),
    expiresAt,
    paymentReference,
    amountUsd: planDetails.price,
  },
  create: {
    userId: req.userId!,
    plan,
    status: "pending",
    startedAt: new Date(),
    expiresAt,
    paymentReference,
    amountUsd: planDetails.price,
  },
});

    return res.status(200).json({
  success: true,
  paymentRef: paymentReference,
  plan: planDetails.label,
  amount: planDetails.price,
  paymentMethod,
  instructions: getPaymentInstructions(
    paymentMethod,
    planDetails.price,
    paymentReference,
    phone
  ),
});

  } catch (error) {
    console.error("Subscription initiate error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to initiate payment. Please try again.",
    });
  }
});

// POST /api/subscriptions/confirm
router.post("/confirm", async (req: AuthRequest, res: Response) => {
  try {
    const { paymentReference } = req.body;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        error: "Payment reference required.",
      });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { paymentReference, userId: req.userId! },
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Payment reference not found.",
      });
    }

    if (subscription.status === "active") {
      return res.status(200).json({
        success: true,
        message: "Subscription already active.",
        alreadyActive: true,
      });
    }

    // Activate subscription
    await prisma.subscription.update({
  where: { userId: req.userId! },
  data: { status: "active" },
});

    return res.status(200).json({
      success: true,
      message: "Subscription activated! Welcome to ZimMaths Premium! 🎉",
      plan: subscription.plan,
      expiresAt: subscription.expiresAt,
    });
  } catch (error) {
    console.error("Subscription confirm error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to confirm payment.",
    });
  }
});

// Helper — payment instructions per method
function getPaymentInstructions(
  method: string,
  amount: number,
  ref: string,
  phone?: string
): string {
  switch (method) {
    case "ecocash":
      return `Send $${amount} USD via EcoCash to 0771234567. Use reference: ${ref}. Send your payment screenshot to +263 71 234 5678 on WhatsApp to activate your account immediately.`;
    case "innbucks":
      return `Send $${amount} USD via Innbucks to zimmaths@innbucks. Use reference: ${ref}. Send your payment screenshot to +263 71 234 5678 on WhatsApp to activate your account immediately.`;
    case "omari":
      return `Send $${amount} USD via Omari to 0771234567. Use reference: ${ref}. Send your payment screenshot to +263 71 234 5678 on WhatsApp to activate your account immediately.`;
    default:
      return `Send $${amount} USD. Reference: ${ref}. Contact support on WhatsApp: +263 71 234 5678.`;
  }
}

export default router;