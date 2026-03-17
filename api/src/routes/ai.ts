import { Router, Request, Response } from 'express';
import OpenAI from 'openai';

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com', // DeepSeek's API endpoint
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
"I can only help with ZIMSEC O-Level Maths. Ask me anything about these topics: General Arithmetic, Number Bases, Algebra, Sets, Geometry, Trigonometry, Mensuration, Graphs & Variation, Statistics, Probability, Matrices & Transformations, Vectors, Coordinate Geometry, Financial Mathematics, or Measurement & Estimation."`

// POST chat message
router.post('/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Build conversation history for context
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...(history || []).map((msg: any) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call DeepSeek API
    const completion = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({
      success: true,
      message: response,
      role: 'assistant',
    });
  } catch (error: any) {
    console.error('DeepSeek AI error:', error);
    res.status(500).json({
      success: false,
      message: 'Takudzwa is temporarily unavailable. Please try again.',
    });
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

export default router;