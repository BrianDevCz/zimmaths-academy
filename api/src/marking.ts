// Smart marking engine for ZIMSEC O-Level Maths
// Handles numerical answers, expressions, and common variations

export interface MarkingResult {
  isCorrect: boolean;
  confidence: "exact" | "numerical" | "approximate" | "wrong";
  feedback: string;
}

export function markAnswer(
  userAnswer: string,
  correctAnswer: string,
  solutionText: string
): MarkingResult {
  const userClean = userAnswer.trim();
  const correctClean = correctAnswer.trim();

  if (!userClean) {
    return { isCorrect: false, confidence: "wrong", feedback: "No answer given." };
  }

  // 1. Exact match (case insensitive)
  if (userClean.toLowerCase() === correctClean.toLowerCase()) {
    return { isCorrect: true, confidence: "exact", feedback: "Correct!" };
  }

  // 2. Normalised string match
  const userNorm = normaliseExpression(userClean);
  const correctNorm = normaliseExpression(correctClean);

  if (userNorm === correctNorm) {
    return { isCorrect: true, confidence: "exact", feedback: "Correct!" };
  }

  // 3. Standard form equivalence — e.g. 2.5 * 10^1 === 2.5 × 10¹ === 25
  const userStd = parseStandardForm(userClean);
  const correctStd = parseStandardForm(correctClean);
  if (userStd !== null && correctStd !== null) {
    if (Math.abs(userStd - correctStd) < 0.001) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }

  // 4. Numerical match — extract all numbers and compare
  const userNum = extractFinalNumber(userClean);
  const correctNum = extractFinalNumber(correctClean);

  if (userNum !== null && correctNum !== null) {
    if (Math.abs(userNum - correctNum) < 0.001) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
    // Approximate match within 2% tolerance
    const tolerance = Math.abs(correctNum) > 1
      ? Math.abs(correctNum) * 0.02
      : 0.05;
    if (Math.abs(userNum - correctNum) <= tolerance) {
      return {
        isCorrect: true,
        confidence: "approximate",
        feedback: "Correct! (accepted within rounding tolerance)",
      };
    }
  }

  // 5. Fraction equivalence — e.g. 3/4 === 0.75
  const userFrac = parseFraction(userClean);
  const correctFrac = parseFraction(correctClean);
  if (userFrac !== null && correctFrac !== null) {
    if (Math.abs(userFrac - correctFrac) < 0.001) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }
  // Compare fraction to decimal
  if (userFrac !== null && correctNum !== null) {
    if (Math.abs(userFrac - correctNum) < 0.001) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }
  if (userNum !== null && correctFrac !== null) {
    if (Math.abs(userNum - correctFrac) < 0.001) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }

  // 6. Multiple answers match — e.g. "x = 3, y = 1" or "x=3 y=1"
  if (containsMultipleAnswers(userClean) || containsMultipleAnswers(correctClean)) {
    if (multipleAnswersMatch(userClean, correctClean)) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }

  // 7. Algebraic expression match — e.g. 3x(x-4) === 3x(x - 4)
  const userAlg = normaliseAlgebra(userClean);
  const correctAlg = normaliseAlgebra(correctClean);
  if (userAlg === correctAlg && userAlg.length > 1) {
    return { isCorrect: true, confidence: "exact", feedback: "Correct!" };
  }

  // 8. Check if user answer appears as a value in solution text
  if (solutionText && userClean.length > 0) {
    const solutionNorm = normaliseExpression(solutionText.toLowerCase());
    const userVal = normaliseExpression(userClean.toLowerCase());
    if (userVal.length > 1 && solutionNorm.includes(userVal)) {
      return { isCorrect: true, confidence: "numerical", feedback: "Correct!" };
    }
  }

  return {
    isCorrect: false,
    confidence: "wrong",
    feedback: `Incorrect. The correct answer is: ${correctAnswer}`,
  };
}

// Normalise mathematical expressions
function normaliseExpression(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/−/g, "-")        // unicode minus
    .replace(/–/g, "-")        // en dash
    .replace(/,(?=\d)/g, ".")  // comma decimal 31,25 → 31.25
    .replace(/\^1$/g, "")      // x^1 → x
    .replace(/¹/g, "^1")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[()]/g, "")
    .trim();
}

// Normalise algebraic expressions
function normaliseAlgebra(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/×/g, "*")
    .replace(/−/g, "-")
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/\s*\(\s*/g, "(")
    .replace(/\s*\)\s*/g, ")")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s*\+\s*/g, "+")
    .trim();
}

// Extract the final/primary number from an answer
function extractFinalNumber(str: string): number | null {
  const cleaned = str
    .replace(/[a-df-wyz°$%²³]/gi, " ")  // remove units but keep numbers
    .replace(/\s+/g, " ")
    .trim();

  const matches = cleaned.match(/-?\d+\.?\d*/g);
  if (!matches || matches.length === 0) return null;
  return parseFloat(matches[matches.length - 1]);
}

// Parse standard form: 2.5 × 10^3, 2.5e3, 2.5 * 10^3
function parseStandardForm(str: string): number | null {
  const norm = str
    .replace(/×/g, "*")
    .replace(/\s+/g, "")
    .replace(/¹/g, "1").replace(/²/g, "2").replace(/³/g, "3")
    .replace(/⁴/g, "4").replace(/⁵/g, "5").replace(/⁶/g, "6")
    .replace(/⁷/g, "7").replace(/⁸/g, "8").replace(/⁹/g, "9")
    .replace(/⁰/g, "0");

  // Match A * 10^B or AeB
  const stdMatch = norm.match(/^(-?\d+\.?\d*)\*10\^(-?\d+)$/);
  if (stdMatch) {
    return parseFloat(stdMatch[1]) * Math.pow(10, parseInt(stdMatch[2]));
  }

  const eMatch = norm.match(/^(-?\d+\.?\d*)[eE](-?\d+)$/);
  if (eMatch) {
    return parseFloat(eMatch[1]) * Math.pow(10, parseInt(eMatch[2]));
  }

  return null;
}

// Parse simple fractions: 3/4, 1/2
function parseFraction(str: string): number | null {
  const clean = str.replace(/\s+/g, "");
  const match = clean.match(/^(-?\d+)\/(-?\d+)$/);
  if (match && parseInt(match[2]) !== 0) {
    return parseInt(match[1]) / parseInt(match[2]);
  }
  return null;
}

// Check if answer contains multiple variables
function containsMultipleAnswers(str: string): boolean {
  return /[a-z]\s*=\s*-?\d/.test(str.toLowerCase());
}

// Match multiple variable answers like "x=3,y=1" vs "x=3 y=1"
function multipleAnswersMatch(user: string, correct: string): boolean {
  const extractPairs = (str: string): Map<string, number> => {
    const pairs = new Map<string, number>();
    const matches = str.toLowerCase().matchAll(/([a-z])\s*=\s*(-?\d+\.?\d*)/g);
    for (const match of matches) {
      pairs.set(match[1], parseFloat(match[2]));
    }
    return pairs;
  };

  const userPairs = extractPairs(user);
  const correctPairs = extractPairs(correct);

  if (userPairs.size === 0 || correctPairs.size === 0) return false;
  if (userPairs.size !== correctPairs.size) return false;

  for (const [key, val] of correctPairs) {
    const userVal = userPairs.get(key);
    if (userVal === undefined) return false;
    if (Math.abs(userVal - val) > 0.001) return false;
  }

  return true;
}