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

dotenv.config();

// General rate limiter — all routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500,
  message: { success: false, error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict limiter — auth routes only
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI limiter — prevent API cost abuse
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { success: false, error: "AI request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(generalLimiter);
app.use(express.json());

// Routes
import { requireAuth } from "./middleware/auth";

// Public routes — no auth needed
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/papers", papersRouter);
app.use("/api/daily", dailyRouter);

// Protected routes — login required
app.use("/api/questions", requireAuth, questionsRouter);
app.use("/api/practice", requireAuth, practiceRouter);
app.use("/api/ai", aiLimiter, requireAuth, aiRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'ZimMaths Academy API'
  });
});

// Root
app.get('/', (req, res) => {
  res.json({
    message: 'ZimMaths Academy API is running! 🚀',
    version: '1.0.0',
    status: 'healthy'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ ZimMaths API running on http://localhost:${PORT}`);
});

export default app;
