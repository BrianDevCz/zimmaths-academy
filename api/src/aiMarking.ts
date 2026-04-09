import OpenAI from "openai";
import Tesseract from "tesseract.js";

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
  part: string;        // "a", "b", "c" etc
  isCorrect: boolean;
  marksAwarded: number;
  feedback: string;
}

// Extract text from image using Tesseract OCR
export async function extractTextFromImage(imageBase64: string): Promise<string> {
  try {
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    const result = await Tesseract.recognize(buffer, "eng", {
      logger: () => {},
    });

    return result.data.text.trim();
  } catch (error) {
    console.error("OCR error:", error);
    return "";
  }
}

// Detect if a question has multiple parts — (a), (b), (c) etc
export function isMultiPartQuestion(questionText: string): boolean {
  return /\([a-e]\)/.test(questionText);
}

// Extract parts from a question text — returns ["a", "b", "c"] etc
function extractQuestionParts(questionText: string): string[] {
  const matches = questionText.match(/\(([a-e])\)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[()]/g, "")))];
}

// Parse student's answer into parts
// e.g. "a) (3,-8) b) 5" or "a: (3,-8), b: 5" or "(a) (3,-8) (b) 5"
function parseStudentParts(
  userAnswer: string,
  parts: string[]
): Map<string, string> {
  const result = new Map<string, string>();

  // Try to split by part labels
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];

    // Build regex to find this part's answer
    // Matches: "a)", "a:", "(a)", "a =" followed by content until next part or end
    const startPattern = new RegExp(
      `(?:^|\\s)(?:\\(${part}\\)|${part}[):\\s])\\s*`,
      "i"
    );
    const endPattern = nextPart
      ? new RegExp(
          `\\s*(?:\\(${nextPart}\\)|${nextPart}[):\\s])`,
          "i"
        )
      : null;

    const startMatch = userAnswer.search(startPattern);
    if (startMatch === -1) continue;

    const startIdx = startMatch + userAnswer.slice(startMatch).search(/\S/);
    // skip the label itself
    const labelEnd = userAnswer
      .slice(startIdx)
      .search(/\s/) + startIdx + 1;

    const content = userAnswer.slice(labelEnd);
    const endMatch = endPattern ? content.search(endPattern) : -1;

    const partAnswer = endMatch === -1
      ? content.trim()
      : content.slice(0, endMatch).trim();

    if (partAnswer) result.set(part, partAnswer);
  }

  // If no parts parsed, try splitting by "and"
  if (result.size === 0 && parts.length === 2) {
    const andSplit = userAnswer.split(/\band\b/i);
    if (andSplit.length === 2) {
      result.set(parts[0], andSplit[0].trim());
      result.set(parts[1], andSplit[1].trim());
    }
  }

  // If still nothing, put everything under first part
  if (result.size === 0 && parts.length > 0) {
    result.set(parts[0], userAnswer.trim());
  }

  return result;
}

// AI marking using DeepSeek — handles both single and multi-part
export async function markAnswerWithAI(
  questionText: string,
  userAnswer: string,
  correctAnswer: string,
  solutionText: string,
  totalMarks: number
): Promise<AIMarkingResult> {
  try {
    const parts = extractQuestionParts(questionText);
    const isMultiPart = parts.length > 1;

    const prompt = isMultiPart
      ? buildMultiPartPrompt(
          questionText,
          userAnswer,
          correctAnswer,
          solutionText,
          totalMarks,
          parts
        )
      : buildSinglePartPrompt(
          questionText,
          userAnswer,
          correctAnswer,
          solutionText,
          totalMarks
        );

    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]);

    if (isMultiPart && parsed.parts) {
      // Multi-part result
      const partResults: PartResult[] = parsed.parts.map((p: any) => ({
        part: p.part,
        isCorrect: p.isCorrect === true,
        marksAwarded: Math.max(0, parseInt(p.marksAwarded) || 0),
        feedback: p.feedback || "",
      }));

      const totalAwarded = partResults.reduce(
        (sum, p) => sum + p.marksAwarded, 0
      );
      const allCorrect = partResults.every((p) => p.isCorrect);
      const anyCorrect = partResults.some((p) => p.isCorrect);

      return {
        isCorrect: allCorrect,
        isPartiallyCorrect: !allCorrect && anyCorrect,
        marksAwarded: Math.min(totalAwarded, totalMarks),
        totalMarks,
        confidence: allCorrect ? "exact" : anyCorrect ? "partial" : "wrong",
        feedback: parsed.overallFeedback || "",
        workingShown: parsed.workingShown === true,
        method: "ai",
        partResults,
      };
    } else {
      // Single part result
      return {
        isCorrect: parsed.isCorrect === true,
        isPartiallyCorrect: parsed.isPartiallyCorrect === true,
        marksAwarded: Math.min(
          Math.max(0, parseInt(parsed.marksAwarded) || 0),
          totalMarks
        ),
        totalMarks,
        confidence: parsed.isCorrect
          ? "exact"
          : parsed.isPartiallyCorrect
          ? "partial"
          : "wrong",
        feedback: parsed.feedback || "",
        workingShown: parsed.workingShown === true,
        method: "ai",
      };
    }
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

function buildSinglePartPrompt(
  questionText: string,
  userAnswer: string,
  correctAnswer: string,
  solutionText: string,
  totalMarks: number
): string {
  return `You are a ZIMSEC O-Level Mathematics examiner.

QUESTION: ${questionText}
CORRECT ANSWER: ${correctAnswer}
FULL SOLUTION: ${solutionText}
TOTAL MARKS: ${totalMarks}
STUDENT'S ANSWER: ${userAnswer}

Mark this answer as a ZIMSEC examiner would. Accept equivalent forms (fractions=decimals, factored=expanded etc). Award method marks for correct working with arithmetic errors.

Respond ONLY with this JSON:
{
  "isCorrect": true/false,
  "isPartiallyCorrect": true/false,
  "marksAwarded": number,
  "feedback": "1-2 sentence feedback for the student",
  "workingShown": true/false
}`;
}

function buildMultiPartPrompt(
  questionText: string,
  userAnswer: string,
  correctAnswer: string,
  solutionText: string,
  totalMarks: number,
  parts: string[]
): string {
  return `You are a ZIMSEC O-Level Mathematics examiner marking a multi-part question.

QUESTION: ${questionText}
CORRECT ANSWER / MARK SCHEME: ${correctAnswer}
FULL SOLUTION: ${solutionText}
TOTAL MARKS: ${totalMarks}
PARTS IN THIS QUESTION: ${parts.join(", ")}
STUDENT'S ANSWER: ${userAnswer}

The student has answered a question with parts: ${parts.map((p) => `(${p})`).join(", ")}.
Mark EACH part separately. The student may label their answers as "a) ... b) ..." or "a: ... b: ..." or just write answers separated by "and" or commas.
Distribute the ${totalMarks} marks fairly across the parts based on the mark scheme.
Accept equivalent mathematical forms. Award method marks where appropriate.

Respond ONLY with this JSON:
{
  "parts": [
    {
      "part": "a",
      "isCorrect": true/false,
      "marksAwarded": number,
      "feedback": "brief feedback for this part"
    },
    {
      "part": "b",
      "isCorrect": true/false,
      "marksAwarded": number,
      "feedback": "brief feedback for this part"
    }
  ],
  "overallFeedback": "1 sentence overall feedback",
  "workingShown": true/false
}`;
}