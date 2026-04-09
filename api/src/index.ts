import adminRouter from "./routes/admin";
import { requireAdmin, requireAuth } from "./middleware/auth";
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import topicsRouter from './routes/topics';
import authRouter from './routes/auth';
import papersRouter from './routes/papers';
import questionsRouter from './routes/questions';
import practiceRouter from './routes/practice';
import dailyRouter from './routes/daily';
import aiRouter from './routes/ai';
import dashboardRouter from './routes/dashboard';
import rateLimit from "express-rate-limit";
import leaderboardRouter from "./routes/leaderboard";
import subscriptionsRouter from "./routes/subscriptions";
import { PrismaClient } from "@prisma/client";

dotenv.config();

// const prisma = new PrismaClient(); // REMOVED

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: "AI request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitise all incoming request bodies — strip XSS and NoSQL injection attempts
app.use((req, res, next) => {
  if (req.body) {
    const xss = require("xss");
    const sanitise = (obj: any): any => {
      if (typeof obj === "string") return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitise);
      if (obj && typeof obj === "object") {
        const clean: any = {};
        for (const key of Object.keys(obj)) {
          // Strip keys that start with $ or contain . (NoSQL injection)
          if (key.startsWith("$") || key.includes(".")) continue;
          clean[key] = sanitise(obj[key]);
        }
        return clean;
      }
      return obj;
    };
    req.body = sanitise(req.body);
  }
  next();
});

// REMOVED the entire app.get("/api/questions", ...) block here

// Public routes
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/papers", papersRouter);
app.use("/api/daily", dailyRouter);

// Protected routes
app.use("/api/admin", requireAdmin, adminRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/practice", requireAuth, practiceRouter);
app.use("/api/ai", aiLimiter, requireAuth, aiRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/leaderboard", requireAuth, leaderboardRouter);
app.use("/api/subscriptions", requireAuth, subscriptionsRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString(), service: 'ZimMaths Academy API' });
});

app.get('/', (req, res) => {
  res.json({ message: 'ZimMaths Academy API is running! 🚀', version: '1.0.0', status: 'healthy' });
});

app.listen(PORT, () => {
  console.log(`✅ ZimMaths API running on http://localhost:${PORT}`);
});

export default app;