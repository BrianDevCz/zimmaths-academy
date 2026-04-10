import OpenAI from "openai";

const deepseek = new OpenAI({
  baseURL: "https://api.deepseek.com",
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export interface AIMarkingResult {
  isCorrect: boolean;
  isPartiallyCorrect: boolean;
  marksAwarded: number;
  totalMarks: number;
  confidence: "exact" | "numerical" | "approximate" | "partial" | "wrong";
  feedback: string;
  workingShown: boolean;
  method: "smart" | "ai";
  partResults?: PartResult[];
}

export interface PartResult {
  part: string;
  isCorrect: boolean;
  marksAwarded: number;
  feedback: string;
}

// ── Timeout helper ────────────────────────────────────────────
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise
      .then((val) => { clearTimeout(timer); resolve(val); })
      .catch((err) => { clearTimeout(timer); reject(err); });
  });
}

// ── OCR via OpenRouter vision model ───────────────────────────
// Single model, single attempt, hard 15s timeout — no infinite loops
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  const base64Data = imageBase64.startsWith("data:")
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
      "HTTP-Referer": "https://zimmaths.com",
      "X-Title": "ZimMaths Academy",
    },
  });

  // Try models in order — stop at first success, hard timeout per attempt
  const models = [
    "google/gemini-2.0-flash-001",
    "meta-llama/llama-3.2-11b-vision-instruct",
  ];

  for (const model of models) {
    try {
      console.log(`OCR: trying ${model}...`);

      const response = await withTimeout(
        openrouter.chat.completions.create({
          model,
          max_tokens: 300,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: { url: base64Data },
                },
                {
                  type: "text",
                  text: `Read this handwritten maths working and extract the text exactly as written.
Return ONLY the mathematical content visible in the image — numbers, symbols, working steps, and the final answer.
Do NOT add explanations, commentary, labels, or anything not in the image.
If you cannot read the handwriting clearly, return exactly: UNREADABLE
Format fractions as a/b, powers as x^2, mixed numbers as a b/c.`,
                },
              ] as any,
            },
          ],
        }),
        15000, // 15 second hard timeout
        `OCR ${model}`
      );

      const text = (response.choices[0]?.message?.content || "").trim();

      // Reject empty, too short, or explicit unreadable
      if (!text || text.length < 2 || text.toUpperCase().includes("UNREADABLE")) {
        console.log(`OCR ${model}: unreadable or empty — trying next model`);
        continue;
      }

      console.log(`OCR succeeded with ${model}:`, text.slice(0, 100));
      return text;
    } catch (error: any) {
      console.error(`OCR ${model} failed:`, error?.message || error);
      // Continue to next model
    }
  }

  console.error("All OCR models failed");
  return "";
}

// ── Detect multi-part questions ───────────────────────────────
export function isMultiPartQuestion(questionText: string): boolean {
  return /\([a-e]\)/.test(questionText);
}

function extractQuestionParts(questionText: string): string[] {
  const matches = questionText.match(/\(([a-e])\)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[()]/g, "")))];
}

// ── AI marking using DeepSeek ─────────────────────────────────
export async function markAnswerWithAI(
  questionText: string,
  userAnswer: string,
  correctAnswer: string,
  solutionText: string,
  totalMarks: number,
  partAnswers?: { [key: string]: string } | null
): Promise<AIMarkingResult> {
  try {
    const parts = extractQuestionParts(questionText);
    const isMultiPart = parts.length > 1;

    // ── MULTI-PART: mark each part individually ──
    if (isMultiPart && partAnswers) {
      const partResults: PartResult[] = [];

      for (const part of parts) {
        const studentPartAnswer = (partAnswers[part] || "").trim();

        // No answer for this part = instant 0, skip AI call
        if (!studentPartAnswer) {
          partResults.push({
            part,
            isCorrect: false,
            marksAwarded: 0,
            feedback: `Part (${part}): No answer given.`,
          });
          continue;
        }

        // Mark this individual part with AI
        const partPrompt = `You are a ZIMSEC O-Level Mathematics examiner marking ONE part of a question.

FULL QUESTION: ${questionText}
FULL CORRECT ANSWER / MARK SCHEME: ${correctAnswer}
FULL SOLUTION: ${solutionText}

YOU ARE MARKING ONLY PART (${part}).
STUDENT'S ANSWER FOR PART (${part}): ${studentPartAnswer}

Rules:
- ONLY mark part (${part}). Ignore all other parts.
- Compare the student's answer for part (${part}) against the correct answer for part (${part}) from the mark scheme.
- Accept mathematically equivalent forms (e.g. 0.5 = 1/2, x^2+2x+1 = (x+1)^2).
- Award method marks if working is partially correct.
- The student's answer is ONLY what appears after "STUDENT'S ANSWER FOR PART (${part}):" above. Do NOT use the correct answer as the student's answer.

Respond ONLY with this JSON (no other text):
{
  "isCorrect": true or false,
  "marksAwarded": number,
  "feedback": "1 sentence feedback for part (${part})"
}`;

        try {
          const response = await withTimeout(
            deepseek.chat.completions.create({
              model: "deepseek-chat",
              messages: [{ role: "user", content: partPrompt }],
              max_tokens: 200,
              temperature: 0.1,
            }),
            12000,
            `AI marking part (${part})`
          );

          const content = response.choices[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);

          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            partResults.push({
              part,
              isCorrect: parsed.isCorrect === true,
              marksAwarded: Math.max(0, parseInt(parsed.marksAwarded) || 0),
              feedback: parsed.feedback || "",
            });
          } else {
            throw new Error("No JSON in AI response");
          }
        } catch (partErr) {
          console.error(`AI marking failed for part (${part}):`, partErr);
          partResults.push({
            part,
            isCorrect: false,
            marksAwarded: 0,
            feedback: `Part (${part}): Could not mark automatically.`,
          });
        }
      }

      const totalAwarded = partResults.reduce((sum, p) => sum + p.marksAwarded, 0);
      const allCorrect = partResults.every((p) => p.isCorrect);
      const anyCorrect = partResults.some((p) => p.isCorrect);

      return {
        isCorrect: allCorrect,
        isPartiallyCorrect: !allCorrect && anyCorrect,
        marksAwarded: Math.min(totalAwarded, totalMarks),
        totalMarks,
        confidence: allCorrect ? "exact" : anyCorrect ? "partial" : "wrong",
        feedback: partResults.map((p) => `(${p.part}) ${p.feedback}`).join(" | "),
        workingShown: false,
        method: "ai",
        partResults,
      };
    }

    // ── SINGLE-PART marking ──
    const prompt = `You are a ZIMSEC O-Level Mathematics examiner.

QUESTION: ${questionText}
CORRECT ANSWER: ${correctAnswer}
FULL SOLUTION: ${solutionText}
TOTAL MARKS: ${totalMarks}
STUDENT'S ANSWER: ${userAnswer}

CRITICAL RULES:
- The student's answer is ONLY what appears after "STUDENT'S ANSWER:" above.
- Do NOT confuse the correct answer or solution with the student's answer.
- If the student's answer is empty, blank, or just whitespace, it is WRONG — award 0 marks.
- Accept mathematically equivalent forms (e.g. 0.5 = 1/2, factored = expanded).
- Award method marks for correct working with arithmetic errors.

Respond ONLY with this JSON (no other text):
{
  "isCorrect": true or false,
  "isPartiallyCorrect": true or false,
  "marksAwarded": number,
  "feedback": "1-2 sentence feedback for the student",
  "workingShown": true or false
}`;

    const response = await withTimeout(
      deepseek.chat.completions.create({
        model: "deepseek-chat",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 300,
        temperature: 0.1,
      }),
      12000,
      "AI marking single"
    );

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      isCorrect: parsed.isCorrect === true,
      isPartiallyCorrect: parsed.isPartiallyCorrect === true,
      marksAwarded: Math.min(Math.max(0, parseInt(parsed.marksAwarded) || 0), totalMarks),
      totalMarks,
      confidence: parsed.isCorrect ? "exact" : parsed.isPartiallyCorrect ? "partial" : "wrong",
      feedback: parsed.feedback || "",
      workingShown: parsed.workingShown === true,
      method: "ai",
    };
  } catch (error) {
    console.error("AI marking error:", error);
    return {
      isCorrect: false,
      isPartiallyCorrect: false,
      marksAwarded: 0,
      totalMarks,
      confidence: "wrong",
      feedback: "Could not mark automatically. Please check your answer.",
      workingShown: false,
      method: "ai",
    };
  }
}