import { Router, Response, Request } from "express";
import { PrismaClient } from "@prisma/client";
import { AuthRequest } from "../middleware/auth";
import { z } from "zod";
const { Paynow } = require("paynow");

const router = Router();
const prisma = new PrismaClient();

// Initialize Paynow
const paynow = new Paynow(
  process.env.PAYNOW_INTEGRATION_ID,
  process.env.PAYNOW_INTEGRATION_KEY,
  process.env.PAYNOW_RESULT_URL,
  process.env.PAYNOW_RETURN_URL
);

const plans: Record<string, { label: string; price: number; days: number }> = {
  two_weeks: { label: "2 Weeks", price: 3, days: 14 },
  monthly: { label: "1 Month", price: 5, days: 30 },
  annual: { label: "1 Year", price: 45, days: 365 },
};

// Helper — find subscription by reference string
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

// Helper — activate subscription by id
async function activateSubscription(id: string, userId: string) {
  await prisma.subscription.update({
    where: { id },
    data: { status: "active" },
  });
  console.log(`✅ Subscription activated for user ${userId}`);
}

// GET /api/subscriptions/status
router.get("/status", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.userId,
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
      where: {
        userId: req.userId,
        paymentReference: reference,
      },
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
// Directly polls Paynow for payment status using pollUrl
router.get("/poll-paynow", async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: "User not authenticated" });
    }

    const { pollUrl } = req.query;

    if (!pollUrl) {
      return res.status(400).json({ success: false, error: "Poll URL required." });
    }

    // Ask Paynow directly for payment status
    const status = await paynow.pollTransaction(String(pollUrl));
    console.log("Paynow poll result:", status);

    if (status.paid || status.status?.toLowerCase() === "paid") {
      // Activate subscription in database
      await prisma.subscription.update({
        where: { userId: req.userId },
        data: { status: "active" },
      });

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

    // Generate unique payment reference
    const paymentReference = `ZM-${Date.now()}-${req.userId.slice(0, 8).toUpperCase()}`;

    // Calculate expiry date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + planDetails.days);

    // Upsert subscription — one record per user
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

    // Create Paynow payment using customer email
    const payment = paynow.createPayment(
      paymentReference,
      process.env.PAYNOW_MERCHANT_EMAIL || email
    );
    payment.add(`ZimMaths Premium — ${planDetails.label}`, planDetails.price);

    // Handle different payment methods
    let response;
    if (paymentMethod === "ecocash") {
      response = await paynow.sendMobile(payment, phone, "ecocash");
    } else if (paymentMethod === "innbucks") {
      response = await paynow.sendMobile(payment, phone, "innbucks");
    } else {
      // omari — standard redirect
      response = await paynow.send(payment);
    }

    console.log("Paynow response:", response);

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
      console.error("Paynow error:", response);
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
    console.log("Paynow webhook received:", req.body);

    const reference = String(req.body.reference || "");
    const paynowreference = String(req.body.paynowreference || "");
    const status = String(req.body.status || req.body.paymentstatus || "");
    const paymentStatus = status.toLowerCase();

    console.log(`Webhook — Reference: ${reference}, Status: ${paymentStatus}`);

    if (paymentStatus === "paid") {
      const subscription = await findByReference(reference);

      if (subscription) {
        await activateSubscription(subscription.id, subscription.userId);
      } else {
        console.warn("No subscription found for reference:", reference, paynowreference);
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
    console.log("Paynow callback received:", req.body);

    const reference = String(req.body.reference || "");
    const paynowreference = String(req.body.paynowreference || "");
    const status = String(req.body.status || "");
    const paymentStatus = status.toLowerCase();

    if (paymentStatus === "paid") {
      const subscription = await findByReference(reference);

      if (subscription) {
        await activateSubscription(subscription.id, subscription.userId);
      } else {
        console.warn("No subscription found for callback reference:", reference, paynowreference);
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

    await prisma.subscription.update({
      where: { userId: req.userId },
      data: { status: "active" },
    });

    return res.status(200).json({
      success: true,
      message: "Subscription activated! Welcome to ZimMaths Premium! 🎉",
    });
  } catch (error) {
    console.error("Subscription confirm error:", error);
    return res.status(500).json({ success: false, error: "Failed to confirm payment." });
  }
});

// Helper — payment instructions
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

export default router;