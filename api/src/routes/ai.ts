import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

// OpenRouter client for vision
const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': 'https://zimmaths.com',
    'X-Title': 'ZimMaths Academy',
  },
});

const SYSTEM_PROMPT = `You are Takudzwa, a patient and encouraging maths tutor for Zimbabwean O-Level students.
You ONLY answer questions about ZIMSEC O-Level Mathematics (syllabus 4004/4008).

The 15 topics you cover are: General Arithmetic, Number Bases, Algebra, Sets, Geometry, Trigonometry, Mensuration, Graphs & Variation, Statistics, Probability, Matrices & Transformations, Vectors, Coordinate Geometry, Financial Mathematics, Measurement & Estimation.

ALWAYS: Show step-by-step working. Label each step clearly.
ALWAYS: Explain WHY each step is taken, not just what to do.
ALWAYS: Use simple English that a Form 3 or Form 4 student can understand.
ALWAYS: Encourage the student — never make them feel stupid or discouraged.
ALWAYS: Use LaTeX notation for maths: $x^2$ for inline, $$\\frac{a}{b}$$ for display.

If asked about anything outside ZIMSEC O-Level Maths, respond with:
"I can only help with ZIMSEC O-Level Maths. Ask me anything about these topics: General Arithmetic, Number Bases, Algebra, Sets, Geometry, Trigonometry, Mensuration, Graphs & Variation, Statistics, Probability, Matrices & Transformations, Vectors, Coordinate Geometry, Financial Mathematics, or Measurement & Estimation."`;

// Vision models — try in order
const VISION_MODELS = [
  'google/gemini-2.0-flash-001',
  'meta-llama/llama-3.2-11b-vision-instruct',
];

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

function getUserId(req: Request): string | null {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    return decoded.userId;
  } catch {
    return null;
  }
}

// ── DB-based daily usage tracking (survives restarts & multiple instances) ──
async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; isPremium: boolean; usageCount: number }> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check subscription
  let isPremium = false;
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
    });
    isPremium = !!sub;
  } catch {}

  const limit = isPremium ? 100 : 5;

  // Get or create today's usage record
  let usage = await prisma.aiChatUsage.findFirst({
    where: {
      userId,
      date: { gte: today, lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    },
  });

  if (!usage) {
    usage = await prisma.aiChatUsage.create({
      data: { userId, date: today, messageCount: 0 },
    });
  }

  if (usage.messageCount >= limit) {
    return { allowed: false, isPremium, usageCount: usage.messageCount };
  }

  // Increment usage
  await prisma.aiChatUsage.update({
    where: { id: usage.id },
    data: { messageCount: { increment: 1 } },
  });

  return { allowed: true, isPremium, usageCount: usage.messageCount + 1 };
}

// POST /api/ai/chat
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please log in to use the AI tutor.' });
    }

    const { allowed, isPremium, usageCount } = await checkDailyLimit(userId);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: isPremium
          ? 'You have reached your daily limit of 100 AI questions. Come back tomorrow!'
          : 'You have used your 5 free questions for today. Upgrade to Premium for more!',
      });
    }

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    const limit = isPremium ? 100 : 5;
    res.json({
      success: true,
      message: response,
      role: 'assistant',
      usageCount,
      limit,
    });
  } catch (error: any) {
    console.error('DeepSeek AI error:', error);
    res.status(500).json({ success: false, message: 'Takudzwa is temporarily unavailable. Please try again.' });
  }
});

// GET /api/ai/suggestions
router.get('/suggestions', (req: Request, res: Response) => {
  const suggestions = [
    'Explain how to factorise quadratics',
    'How do I solve simultaneous equations?',
    'What is the sine rule?',
    'Help me understand probability trees',
    'How do I find the gradient of a line?',
    'Explain standard form',
    'How do I calculate compound interest?',
    'What are vectors?',
  ];
  res.json({ success: true, data: suggestions });
});

// POST /api/ai/chat-image — vision models with fallback
router.post('/chat-image', async (req: Request, res: Response) => {
  try {
    const { message, imageBase64, mimeType, history } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Please log in to use the AI tutor.' });
    }

    const { allowed, isPremium } = await checkDailyLimit(userId);
    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: isPremium
          ? 'You have reached your daily limit of 100 AI questions. Come back tomorrow!'
          : 'You have used your 5 free questions for today. Upgrade to Premium for more!',
      });
    }

    const imageUrl = `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`;

    const userContent: any[] = [
      { type: 'image_url', image_url: { url: imageUrl } },
      {
        type: 'text',
        text: `You are a strict ZIMSEC O-Level Mathematics examiner and tutor.

INSTRUCTIONS:
1. Read ONLY the question(s) visible in this image. Do not add, invent, or assume anything not shown.
2. Identify each part of the question (a), (b), (c) etc. and answer each part separately.
3. For each part, show full step-by-step working using correct mathematical methods.
4. After working out your answer, VERIFY it by checking it satisfies the original question.
5. If your first answer is wrong after verification, correct it and show the correction.
6. Use only the information given in the question — do not use outside values unless the question provides them.
7. Give the final answer clearly labelled.
8. Never describe yourself or role-play as a character in the question.

${message ? `Student's additional message: ${message}` : 'Solve all parts of the question shown in the image.'}`,
      },
    ];

    const messages: any[] = [
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: typeof msg.content === 'string' ? msg.content : '',
      })),
      { role: 'user', content: userContent },
    ];

    // Try vision models in order
    for (const model of VISION_MODELS) {
      try {
        console.log(`AI tutor image: trying ${model}...`);
        const completion = await withTimeout(
          openrouter.chat.completions.create({ model, messages, max_tokens: 1000 }),
          20000
        );

        const reply = completion.choices[0]?.message?.content || '';
        if (!reply || reply.length < 5) {
          console.log(`${model}: empty response, trying next...`);
          continue;
        }

        console.log(`AI tutor image succeeded with ${model}`);
        return res.json({ success: true, message: reply, role: 'assistant' });
      } catch (modelErr: any) {
        console.error(`${model} failed:`, modelErr?.message || modelErr);
      }
    }

    res.status(500).json({
      success: false,
      message: 'Sorry, I could not read the image. Please try typing your question instead.',
    });
  } catch (error: any) {
    console.error('Vision AI error:', error);
    res.status(500).json({ success: false, message: 'Could not process image. Please try again.' });
  }
});

export default router;
