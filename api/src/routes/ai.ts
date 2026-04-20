import { Router, Request, Response } from 'express';
import OpenAI from 'openai';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

const SYSTEM_PROMPT = `You are Takudzwa, a patient and encouraging maths tutor for Zimbabwean O-Level students.
You ONLY answer questions about ZIMSEC O-Level Mathematics (syllabus 4004/4008).

The 15 topics you cover are: General Arithmetic, Number Bases, Algebra, Sets, Geometry, Trigonometry, Mensuration, Graphs & Variation, Statistics, Probability, Matrices & Transformations, Vectors, Coordinate Geometry, Financial Mathematics, Measurement & Estimation.

ALWAYS: Show step-by-step working. Label each step clearly.
ALWAYS: Explain WHY each step is taken, not just what to do.
ALWAYS: Use simple English that a Form 3 or Form 4 student can understand.
ALWAYS: Encourage the student — never make them feel stupid or discouraged.
ALWAYS: Use ^ for powers (x^2), / for division in plain text when typing maths.

If asked about anything outside ZIMSEC O-Level Maths, respond with:
"I can only help with ZIMSEC O-Level Maths. Ask me anything about these topics: General Arithmetic, Number Bases, Algebra, Sets, Geometry, Trigonometry, Mensuration, Graphs & Variation, Statistics, Probability, Matrices & Transformations, Vectors, Coordinate Geometry, Financial Mathematics, or Measurement & Estimation."`;

// Define response type for OpenRouter API
interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

// Track daily AI usage per user in memory
const dailyUsage = new Map<string, { count: number; date: string }>();

async function checkDailyLimit(userId: string): Promise<{ allowed: boolean; isPremium: boolean }> {
  const today = new Date().toDateString();

  // Check subscription
  let isPremium = false;
  try {
    const sub = await prisma.subscription.findFirst({
      where: { userId, status: 'active', expiresAt: { gt: new Date() } },
    });
    isPremium = !!sub;
  } catch {}

  const limit = isPremium ? 100 : 5;

  // Get or reset usage
  const usage = dailyUsage.get(userId);
  if (!usage || usage.date !== today) {
    dailyUsage.set(userId, { count: 0, date: today });
  }

  const current = dailyUsage.get(userId)!;
  if (current.count >= limit) {
    return { allowed: false, isPremium };
  }

  current.count++;
  return { allowed: true, isPremium };
}

async function getUserId(req: Request): Promise<string | null> {
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

// POST chat message
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Check daily limit
    const userId = await getUserId(req);
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

    res.json({ success: true, message: response, role: 'assistant' });
  } catch (error: any) {
    console.error('DeepSeek AI error:', error);
    res.status(500).json({ success: false, message: 'Takudzwa is temporarily unavailable. Please try again.' });
  }
});

// GET quick suggestions
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

// POST chat with image
router.post('/chat-image', async (req: Request, res: Response) => {
  try {
    const { message, imageBase64, mimeType, history } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Image is required' });
    }

    // Check daily limit
    const userId = await getUserId(req);
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

    const userContent: any[] = [
      {
        type: 'image_url',
        image_url: {
          url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}`,
        },
      },
      {
        type: 'text',
        text: message || 'Please read this maths question and solve it step by step.',
      },
    ];

    const messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: userContent },
    ];

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.2-11b-vision-instruct:free',
        messages,
        max_tokens: 1000,
      }),
    });

    const data = await response.json() as OpenRouterResponse;
    console.log('OpenRouter response:', JSON.stringify(data));
    const reply = data.choices?.[0]?.message?.content || 'Sorry, I could not read the image.';

    res.json({ success: true, message: reply, role: 'assistant' });
  } catch (error: any) {
    console.error('Vision AI error:', error);
    res.status(500).json({ success: false, message: 'Could not process image. Please try again.' });
  }
});

export default router;
