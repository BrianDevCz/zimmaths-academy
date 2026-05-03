import adminRouter from "./routes/admin";
import { requireAdmin, requireAuth } from "./middleware/auth";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import topicsRouter from "./routes/topics";
import authRouter from "./routes/auth";
import papersRouter from "./routes/papers";
import questionsRouter from "./routes/questions";
import practiceRouter from "./routes/practice";
import dailyRouter from "./routes/daily";
import aiRouter from "./routes/ai";
import dashboardRouter from "./routes/dashboard";
import rateLimit from "express-rate-limit";
import leaderboardRouter from "./routes/leaderboard";
import subscriptionsRouter from "./routes/subscriptions";
import bookmarksRouter from "./routes/bookmarks";
import badgesRouter from "./routes/badges";
import shareRouter from "./routes/share";
import referralsRouter from "./routes/referrals";
import whatsappRouter from "./routes/whatsapp";
import syllabusRouter from "./routes/syllabus";

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust Railway's proxy
const PORT = process.env.PORT || 5000;

// ── Rate Limiters ─────────────────────────────────────────────

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  message: { success: false, error: "Too many requests. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict login limiter — 10 attempts per 15 min per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many login attempts. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
});

// Auth limiter for register/forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, error: "Too many requests. Please wait 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// AI limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 50,
  message: { success: false, error: "AI request limit reached. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin limiter — very strict
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, error: "Too many admin requests." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Payment limiter — prevent payment spam
const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, error: "Too many payment attempts. Please wait an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── CORS ──────────────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:3000",
  "https://zimmaths.com",
  "https://www.zimmaths.com",
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin && process.env.NODE_ENV !== "production") return callback(null, true);
    if (allowedOrigins.includes(origin as string)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// ── Core Middleware ───────────────────────────────────────────
app.use(generalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Sanitise all incoming request bodies — strip XSS and NoSQL injection
app.use((req, res, next) => {
  if (req.body) {
    const xss = require("xss");
    const sanitise = (obj: any): any => {
      if (typeof obj === "string") return xss(obj);
      if (Array.isArray(obj)) return obj.map(sanitise);
      if (obj && typeof obj === "object") {
        const clean: any = {};
        for (const key of Object.keys(obj)) {
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

// Security headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

// ── Routes ────────────────────────────────────────────────────

// Public routes
app.use("/api/auth/login", loginLimiter);           // extra strict on login
app.use("/api/auth", authLimiter, authRouter);
app.use("/api/topics", topicsRouter);
app.use("/api/papers", papersRouter);
app.use("/api/daily", dailyRouter);
app.use("/api/share", shareRouter);

// Protected routes
app.use("/api/admin", adminLimiter, requireAdmin, adminRouter);
app.use("/api/questions", questionsRouter);
app.use("/api/practice", requireAuth, practiceRouter);
app.use("/api/ai", aiLimiter, requireAuth, aiRouter);
app.use("/api/dashboard", requireAuth, dashboardRouter);
app.use("/api/leaderboard", requireAuth, leaderboardRouter);
app.use("/api/subscriptions/initiate-paynow", paymentLimiter);
app.use("/api/subscriptions", requireAuth, subscriptionsRouter);
app.use("/api/bookmarks", requireAuth, bookmarksRouter);
app.use("/api/badges", requireAuth, badgesRouter);
app.use("/api/referrals", requireAuth, referralsRouter);
app.use("/api/admin/whatsapp", requireAdmin, whatsappRouter);
app.use("/api/syllabus", requireAuth, syllabusRouter);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "ZimMaths Academy API",
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "ZimMaths Academy API is running!",
    version: "1.0.0",
    status: "healthy",
  });
});

app.listen(PORT, () => {
  console.log(`✅ ZimMaths API running on http://localhost:${PORT}`);
});

export default app;
