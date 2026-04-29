import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// DeepSeek API helper
async function generateWithAI(prompt: string): Promise<string> {
  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: "You are a WhatsApp Channel content creator for ZimMaths Academy, an educational platform for Zimbabwean O-Level Maths students. Write engaging, friendly posts with emojis. Use *text* for bold emphasis. Keep posts under 400 characters and readable on mobile. Always include a call to action linking to zimmaths.com. Sound like a friendly tutor. NEVER use markdown, HTML, or LaTeX — plain text only with WhatsApp formatting (*bold* only)."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.8,
        max_tokens: 500,
      }),
    });

    const data = await response.json() as { choices?: { message?: { content?: string } }[] };
    return data.choices?.[0]?.message?.content || "";
  } catch (error) {
    console.error("DeepSeek API error:", error);
    return "";
  }
}

// Helper to strip LaTeX to plain readable text
function stripLatex(text: string): string {
  return text
    .replace(/\$\$(.*?)\$\$/g, "$1")
    .replace(/\$(.*?)\$/g, "$1")
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
    .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
    .replace(/\\sqrt/g, "√")
    .replace(/\^2/g, "²")
    .replace(/\^3/g, "³")
    .replace(/\\times/g, "×")
    .replace(/\\div/g, "÷")
    .replace(/\\pm/g, "±")
    .replace(/\\leq/g, "≤")
    .replace(/\\geq/g, "≥")
    .replace(/\\neq/g, "≠")
    .replace(/\\approx/g, "≈")
    .replace(/\\pi/g, "π")
    .replace(/\\theta/g, "θ")
    .replace(/\\alpha/g, "α")
    .replace(/\\beta/g, "β")
    .replace(/\\sin/g, "sin")
    .replace(/\\cos/g, "cos")
    .replace(/\\tan/g, "tan")
    .replace(/\\infty/g, "∞")
    .replace(/\\{/g, "")
    .replace(/\\}/g, "")
    .replace(/\\,/g, "")
    .replace(/\\\\/g, "")
    .replace(/\{/g, "")
    .replace(/\}/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// GET /api/admin/whatsapp/generate — AI generates a WhatsApp Channel post
router.get("/generate", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "question";
    let postContent = "";
    let prompt = "";

    switch (type) {
      // ── QUESTION POST ──────────────────────────────────
      case "question": {
        const questionsCount = await prisma.question.count({
          where: { isDailyEligible: true, questionText: { not: "" } },
        });

        if (questionsCount === 0) {
          return res.json({ success: false, error: "No eligible questions found. Mark some questions as Daily Eligible first." });
        }

        const skip = Math.floor(Math.random() * Math.min(questionsCount, 30));
        const question = await prisma.question.findFirst({
          where: { isDailyEligible: true, questionText: { not: "" } },
          include: {
            topic: { select: { name: true } },
            paper: { select: { title: true, year: true, session: true } },
          },
          orderBy: { createdAt: "desc" },
          skip,
        });

        if (!question) {
          return res.json({ success: false, error: "Failed to fetch question" });
        }

        const cleanQuestion = stripLatex(question.questionText);
        const cleanAnswer = stripLatex(question.correctAnswer || "");
        const topicName = question.topic?.name || "Maths";
        const paperInfo = question.paper
          ? `${question.paper.title} (${question.paper.year} ${question.paper.session})`
          : "Practice Paper";
        const diffLabel = question.difficulty === "easy" ? "Quick one" : question.difficulty === "medium" ? "Medium" : "Tricky";

        prompt = `Create a short, engaging WhatsApp post for ZimMaths Academy. The audience is Zimbabwean O-Level students.

CONTEXT:
- Topic: ${topicName}
- Question: "${cleanQuestion}"
- Answer: "${cleanAnswer || 'N/A'}"
- Difficulty: ${diffLabel} (${question.marks} marks)
- Source: ${paperInfo}

YOUR TASK:
Write a post that follows this EXACT format:

📐 [emoji] *Can you solve this? — ${topicName}*
[diff label emoji] ${diffLabel}

[the question text — exactly as provided, do NOT modify]

_Hint: [write ONE very brief hint that DOES NOT give away the answer]_

Drop your answer in the replies! 👇

_Full step-by-step solution: zimmaths.com/papers_

RULES:
- Keep under 380 characters total
- Use ONLY *text* for bold, no markdown
- Preserve the question text EXACTLY
- The hint must help but NEVER reveal the answer
- Sound encouraging`;

        const aiContent = await generateWithAI(prompt);

        postContent = aiContent || `📐 *Can you solve this? — ${topicName}*\n${diffLabel}\n\n${cleanQuestion}\n\n_Hint: Think about the key steps._\n\nDrop your answer in the replies! 👇\n\n_Full solution: zimmaths.com/papers_`;
        break;
      }

      // ── EXAM TIP POST ──────────────────────────────────
      case "tip": {
        // Get topics to make tips relevant
        const topicList = await prisma.topic.findMany({ select: { name: true }, take: 5 });
        const topics = topicList.map(t => t.name).join(", ");

        prompt = `Create a helpful, practical exam tip for Zimbabwean O-Level Maths students (ZIMSEC). 

Relevant topics on our platform: ${topics}

REQUIREMENTS:
- Start with "💡 *Exam Tip: [Catchy Title]*"
- Give ONE specific, actionable tip (not generic advice)
- Explain WHY it matters (real exam consequence)
- Reference one of the topics above if possible
- End with a link to zimmaths.com
- Keep under 350 characters

EXAMPLES OF GOOD TIPS:
- "Never round until the final step — early rounding can cost you a full mark even if your method is right"
- "If you're stuck for more than 2 minutes, move on. Question 18 might be easier than Question 3"
- "Write down every formula before you start. When panic hits, you'll be glad you did"
- "Check your calculator mode before the exam. STAT mode instead of COMP has ruined many grades"

Pick a fresh tip (not the examples above) that's genuinely useful.`;

        const aiContent = await generateWithAI(prompt);
        postContent = aiContent || `💡 *Exam Tip: Show Your Working*\n\nZIMSEC awards marks for your method, even if the final answer is wrong. Always write your steps!\n\n_Practice: zimmaths.com_`;
        break;
      }

      // ── FUN FACT POST ──────────────────────────────────
      case "fact": {
        prompt = `Create a fascinating "Did You Know?" post connecting maths to something surprising or relevant for Zimbabwean students.

REQUIREMENTS:
- Start with "🔍 *Did You Know?*"
- Share ONE interesting fact about maths (history, real-world use, surprising connection)
- Make it feel relevant to a Zimbabwean student
- End with a link to zimmaths.com
- Keep under 350 characters
- Make them think "wow, maths is actually interesting"

EXAMPLES OF GOOD FACTS:
- "The equals sign (=) was invented in 1557 by a man tired of writing 'is equal to' over and over"
- "Your phone's GPS uses the same trigonometry you're learning in Form 4 to calculate your position from satellites 20,000km above Earth"
- "'Algebra' comes from the Arabic word 'al-jabr' from a book written over 1,200 years ago"

Pick something fresh and genuinely interesting.`;

        const aiContent = await generateWithAI(prompt);
        postContent = aiContent || `🔍 *Did You Know?*\n\nThe word "algebra" comes from the Arabic "al-jabr" from a book written over 1,200 years ago.\n\n_You're part of a long tradition of learners. Keep going: zimmaths.com_`;
        break;
      }

      // ── MOTIVATION POST ────────────────────────────────
      case "motivation": {
        // Get real stats to include
        const totalUsers = await prisma.user.count();
        const totalTests = await prisma.practiceTest.count();
        const totalPoints = await prisma.userPoint.aggregate({ _sum: { points: true } });

        prompt = `Write an encouraging weekly motivation post for Zimbabwean O-Level Maths students on ZimMaths Academy.

REAL STATS TO INCLUDE:
- ${totalUsers.toLocaleString()} students on the platform
- ${totalTests.toLocaleString()} practice tests completed
- ${totalPoints._sum.points?.toLocaleString() || "0"} points earned

REQUIREMENTS:
- Start with "📅 *[Day] Motivation*" where [Day] is today's day of the week
- Include the stats naturally in the message
- Encourage students to set a goal for the week
- Ask them to reply with their goal
- End with a link to zimmaths.com
- Keep under 400 characters
- Sound like a coach who genuinely cares about their success`;

        const aiContent = await generateWithAI(prompt);
        postContent = aiContent || `📅 *Sunday Motivation*\n\n${totalUsers.toLocaleString()} students are already practising on ZimMaths. Set your goal for this week and reply below — we'll check in on Friday!\n\n_Start now: zimmaths.com_`;
        break;
      }

      // ── LEADERBOARD POST ───────────────────────────────
      case "leaderboard": {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const topStudents = await prisma.userPoint.groupBy({
          by: ["userId"],
          where: { awardedAt: { gte: weekAgo } },
          _sum: { points: true },
          orderBy: { _sum: { points: "desc" } },
          take: 5,
        });

        if (topStudents.length === 0) {
          postContent = `🏆 *Weekly Leaderboard*\n\nNo rankings yet this week — be the first to claim the top spot!\n\nComplete today's daily challenge to earn points.\n\n_Start now: zimmaths.com/daily_`;
        } else {
          const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
          let leaderboardText = `🏆 *Weekly Leaderboard*\n\nTop 5 this week:\n\n`;

          for (let i = 0; i < topStudents.length; i++) {
            const user = await prisma.user.findUnique({
              where: { id: topStudents[i].userId },
              select: { name: true },
            });
            const name = user?.name?.split(" ")[0] || "Student";
            const points = topStudents[i]._sum.points?.toLocaleString() || "0";
            leaderboardText += `${medals[i]} ${name} — ${points} pts\n`;
          }

          prompt = `I have a weekly leaderboard for ZimMaths Academy. Make this post more engaging and competitive.

Current leaderboard:
${leaderboardText}

REQUIREMENTS:
- Keep the leaderboard data EXACTLY as provided
- Add ONE encouraging/call-to-action line at the end
- End with "zimmaths.com/daily"
- Keep under 400 characters
- Sound competitive but fun`;

          const aiContent = await generateWithAI(prompt);
          postContent = aiContent || `${leaderboardText}\n_Think you can beat them? Take today's challenge: zimmaths.com/daily_`;
        }
        break;
      }

      default:
        return res.json({ success: false, error: "Invalid content type. Use: question, tip, fact, motivation, or leaderboard" });
    }

    // Save to history
    const post = await prisma.whatsAppPost.create({
      data: {
        content: postContent,
        contentType: type,
      },
    });

    res.json({ success: true, data: { id: post.id, content: postContent, type } });
  } catch (error) {
    console.error("WhatsApp generate error:", error);
    res.status(500).json({ error: "Failed to generate post" });
  }
});

// POST /api/admin/whatsapp/post — Mark a post as sent
router.post("/post", async (req: Request, res: Response) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "Post ID required" });

    await prisma.whatsAppPost.update({
      where: { id },
      data: { posted: true, postedAt: new Date() },
    });

    res.json({ success: true, message: "Post marked as sent" });
  } catch (error) {
    console.error("WhatsApp post error:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
});

// GET /api/admin/whatsapp/history — Get post history
router.get("/history", async (req: Request, res: Response) => {
  try {
    const posts = await prisma.whatsAppPost.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error("WhatsApp history error:", error);
    res.status(500).json({ error: "Failed to load history" });
  }
});

export default router;