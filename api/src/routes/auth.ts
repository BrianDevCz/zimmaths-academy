import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import crypto from "crypto";
import { sendVerificationEmail, sendPasswordResetEmail } from "../email";

const router = Router();
const prisma = new PrismaClient();

// ── Register ─────────────────────────────────────────────────
router.post("/register", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      name: z.string().min(2).max(100),
      email: z.string().email(),
      password: z.string().min(6).max(100),
      grade: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input. Please check your details.",
      });
    }

    const { name, email, password, grade } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({
        success: false,
        error: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Generate email verification token
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        grade: grade || null,
        emailVerified: false,
        verifyToken,
        verifyTokenExp,
      },
    });

    // Send verification email
    console.log(`Sending verification email to: ${email}`);
    const emailSent = await sendVerificationEmail(email, name, verifyToken);
    console.log(`Email sent result: ${emailSent}`);

    return res.status(201).json({
      success: true,
      message: "Account created! Please check your email to verify your account.",
    });
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).json({
      success: false,
      error: "Registration failed. Please try again.",
    });
  }
});

// ── Verify Email ─────────────────────────────────────────────
router.get("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== "string") {
      return res.status(400).json({ success: false, error: "Invalid token." });
    }

    const user = await prisma.user.findFirst({
      where: {
        verifyToken: token,
        verifyTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Verification link is invalid or has expired.",
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verifyToken: null,
        verifyTokenExp: null,
      },
    });

    // Redirect to login with success message
    return res.redirect(
      `${process.env.APP_URL}/login?verified=true`
    );
  } catch (error) {
    console.error("Verify email error:", error);
    return res.status(500).json({ success: false, error: "Verification failed." });
  }
});

// ── Resend Verification ───────────────────────────────────────
router.post("/resend-verification", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal if email exists
      return res.status(200).json({
        success: true,
        message: "If that email exists, a verification link has been sent.",
      });
    }

    if (user.emailVerified) {
      return res.status(400).json({
        success: false,
        error: "This email is already verified.",
      });
    }

    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExp = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyToken, verifyTokenExp },
    });

    await sendVerificationEmail(email, user.name, verifyToken);

    return res.status(200).json({
      success: true,
      message: "Verification email sent. Please check your inbox.",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return res.status(500).json({ success: false, error: "Failed to resend verification." });
  }
});

// ── Login ─────────────────────────────────────────────────────
router.post("/login", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // Block unverified users
    if (!user.emailVerified) {
      return res.status(403).json({
        success: false,
        error: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        role: user.role,
        avatarColour: user.avatarColour,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      error: "Login failed. Please try again.",
    });
  }
});

// ── Forgot Password ───────────────────────────────────────────
router.post("/forgot-password", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, error: "Email required." });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to avoid email enumeration
    if (!user) {
      return res.status(200).json({
        success: true,
        message: "If that email exists, a reset link has been sent.",
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetTokenExp = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetTokenExp },
    });

    await sendPasswordResetEmail(email, user.name, resetToken);

    return res.status(200).json({
      success: true,
      message: "If that email exists, a reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, error: "Failed to send reset email." });
  }
});

// ── Reset Password ────────────────────────────────────────────
router.post("/reset-password", async (req: Request, res: Response) => {
  try {
    const schema = z.object({
      token: z.string(),
      password: z.string().min(6).max(100),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid input.",
      });
    }

    const { token, password } = parsed.data;

    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExp: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        error: "Reset link is invalid or has expired.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExp: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully. You can now log in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return res.status(500).json({ success: false, error: "Password reset failed." });
  }
});

// ── Get Current User ──────────────────────────────────────────
router.get("/me", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Not authenticated." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        role: true,
        avatarColour: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, error: "User not found." });
    }

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid or expired session." });
  }
});

// ── Update Profile ────────────────────────────────────────────
router.put("/me/update", async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, error: "Not authenticated." });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };

    const schema = z.object({
      name: z.string().min(2).max(100).optional(),
      grade: z.string().optional(),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: "Invalid input." });
    }

    const user = await prisma.user.update({
      where: { id: decoded.userId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        grade: true,
        role: true,
        avatarColour: true,
      },
    });

    return res.status(200).json({ success: true, data: user });
  } catch (error) {
    return res.status(401).json({ success: false, error: "Update failed." });
  }
});

// ── Google OAuth Login ────────────────────────────────────────
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { email, name, googleId, avatar } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ success: false, error: "Invalid Google data." });
    }

    // Check if user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Create new user — no password needed for Google users
      user = await prisma.user.create({
        data: {
          name: name || email.split("@")[0],
          email,
          passwordHash: googleId, // use googleId as placeholder
          emailVerified: true, // Google already verified the email
          grade: null,
        },
      });
    } else if (!user.emailVerified) {
      // Mark existing user as verified since Google confirmed the email
      await prisma.user.update({
        where: { id: user.id },
        data: { emailVerified: true },
      });
    }

    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        grade: user.grade,
        role: user.role,
        avatarColour: user.avatarColour,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({ success: false, error: "Google login failed." });
  }
});

export default router;