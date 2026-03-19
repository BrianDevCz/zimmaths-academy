import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  userId?: string;
  userEmail?: string;
  isPremium?: boolean;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string; email: string };

    // Verify user still exists in database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Account not found. Please log in again.",
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.userEmail = decoded.email;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please log in again.",
    });
  }
};

export const requirePremium = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string };

    // Check user has active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: decoded.userId,
        status: "active",
        expiresAt: { gt: new Date() },
      },
    });

    if (!subscription) {
      return res.status(403).json({
        success: false,
        error: "Premium subscription required.",
        upgradeUrl: "/upgrade",
      });
    }

    req.userId = decoded.userId;
    req.isPremium = true;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session. Please log in again.",
    });
  }

};

export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as { userId: string };

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Account not found.",
      });
    }

    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Admin access required.",
      });
    }

    req.userId = decoded.userId;
    req.userEmail = user.email;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Invalid or expired session.",
    });
  }
};