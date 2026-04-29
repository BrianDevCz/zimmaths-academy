import { Router, Request, Response } from "express";
import prisma from "../lib/prisma";

const router = Router();

// GET /api/admin/whatsapp/generate — Generate a WhatsApp Channel post
router.get("/generate", async (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || "question";

    let postContent = "";

    switch (type) {
      case "question": {
        const questionsCount = await prisma.question.count({
          where: { isDailyEligible: true, questionText: { not: "" } },
        });

        const skip = questionsCount > 0 ? Math.floor(Math.random() * Math.min(questionsCount, 20)) : 0;

        const question = await prisma.question.findFirst({
          where: { isDailyEligible: true, questionText: { not: "" } },
          include: { topic: { select: { name: true } }, paper: { select: { title: true } } },
          orderBy: { createdAt: "desc" },
          skip,
        });

        if (!question) {
          return res.json({ success: false, error: "No eligible questions found. Mark some questions as Daily Eligible first." });
        }

        const cleanText = question.questionText
          .replace(/\$\$(.*?)\$\$/g, "$1")
          .replace(/\$(.*?)\$/g, "$1")
          .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, "($1)/($2)")
          .replace(/\\sqrt\{([^}]+)\}/g, "√($1)")
          .replace(/\\times/g, "×")
          .replace(/\\div/g, "÷")
          .replace(/\\{/g, "")
          .replace(/\\}/g, "")
          .replace(/\\\\/g, "")
          .slice(0, 200);

        const topicName = question.topic?.name || "Maths";

        postContent = `📐 *Can you solve this? — ${topicName}*\n\n${cleanText}\n\n_Reply with your answer!_\n\n_Full solution with working: zimmaths.com/papers_`;
        break;
      }

      case "tip": {
        const tips = [
          `💡 *Exam Tip: Show Your Working*\n\nIn ZIMSEC, you get marks for WORKING even if your final answer is wrong.\n\nAlways show your steps:\n1. Write the formula\n2. Substitute values\n3. Solve step by step\n\nA blank page = 0 marks. Messy working with right method = partial marks.\n\n_Practice with real ZIMSEC-style questions: zimmaths.com_`,

          `💡 *Exam Tip: Time Management*\n\nZIMSEC Paper 1 has ~25 questions in 2 hours. That's less than 5 minutes per question.\n\nHere's the trick:\n1️⃣ First pass — answer all the easy ones (skip hard ones)\n2️⃣ Second pass — do the medium ones\n3️⃣ Final pass — attempt the hard ones\n\n_Never get stuck on Question 3 while Question 20 is easy marks._\n\n_Practice timing yourself: zimmaths.com/practice_`,

          `💡 *Exam Tip: Calculator Check*\n\nBefore every exam:\n1. Check your calculator batteries\n2. Clear the memory (SHIFT + 9 + 3 + = + AC)\n3. Set mode to COMP (not STAT)\n\nA dead calculator mid-exam = disaster.\n\n_More exam tips: zimmaths.com_`,

          `💡 *Common Mistake: Rounding*\n\nWhen the question says "Give your answer to 2 decimal places"...\n\nDON'T round until the very last step.\n\nRounding too early can cost you marks even if your method is correct.\n\n_See worked examples: zimmaths.com/topics_`,

          `💡 *Exam Tip: Read the Question Twice*\n\nSounds simple, but most lost marks come from misreading.\n\n1st read: What's the topic?\n2nd read: What EXACTLY are they asking?\n\nUnderline key words: "calculate", "factorise", "solve", "estimate".\n\n_Practice reading questions carefully: zimmaths.com/papers_`,
        ];
        postContent = tips[Math.floor(Math.random() * tips.length)];
        break;
      }

      case "fact": {
        const facts = [
          `🔍 *Did You Know?*\n\nThe equals sign (=) was invented in 1557 by a Welsh mathematician who was tired of writing "is equal to" over and over.\n\nHe chose two parallel lines because "no two things can be more equal."\n\n_Learn more maths: zimmaths.com/topics_`,

          `🔍 *Maths in Real Life*\n\nThat GPS on your phone? It uses trigonometry to calculate your position from satellites 20,000km above Earth.\n\nThe same trigonometry you're learning in Form 4.\n\nMaths isn't just for exams — it runs the world.\n\n_Practice trigonometry: zimmaths.com/topics/trigonometry_`,

          `🔍 *Did You Know?*\n\nThe word "algebra" comes from the Arabic word "al-jabr" from a book written in 820 AD by mathematician Al-Khwarizmi.\n\nYou're studying something humans have been figuring out for over 1,200 years.\n\n_Master algebra: zimmaths.com/topics/algebra_`,

          `🔍 *Did You Know?*\n\nZero was invented independently by the Mayans and by Indian mathematicians around 500 AD.\n\nBefore zero, people just left a blank space. Imagine trying to do maths without zero!\n\n_Explore number bases: zimmaths.com/topics_`,

          `🔍 *Maths in Real Life*\n\nEcoCash transactions? Interest rates? Building a house? All use the maths you're learning.\n\nThe mensuration topic teaches you to calculate areas — that's how builders know how many bricks to buy.\n\n_Practice mensuration: zimmaths.com/topics/mensuration_`,
        ];
        postContent = facts[Math.floor(Math.random() * facts.length)];
        break;
      }

      case "motivation": {
        const totalUsers = await prisma.user.count();
        const totalPoints = await prisma.userPoint.aggregate({ _sum: { points: true } });
        const totalTests = await prisma.practiceTest.count();

        postContent = `📅 *Your Week Ahead*\n\nThis week on ZimMaths:\n\n✅ New practice papers available\n✅ Daily challenges every day\n✅ AI tutor ready to help 24/7\n\nSet a goal: "I will complete 2 papers this week."\n\nReply with your goal and we'll check in on Friday!\n\n👥 ${totalUsers.toLocaleString()} students already studying\n✏️ ${totalTests.toLocaleString()} practice tests taken\n🏆 ${(totalPoints._sum.points || 0).toLocaleString()} total points earned\n\n_You're next: zimmaths.com_`;
        break;
      }

      case "leaderboard": {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const topStudents = await prisma.userPoint.groupBy({
          by: ["userId"],
          where: { awardedAt: { gte: weekAgo } },
          _sum: { points: true },
          orderBy: { _sum: { points: "desc" } },
          take: 3,
        });

        if (topStudents.length === 0) {
          postContent = `🏆 *Leaderboard Update*\n\nNo points earned this week yet!\n\nBe the first to top the leaderboard:\n\nComplete today's daily challenge → earn points → climb the ranks.\n\n_Start now: zimmaths.com/daily_`;
        } else {
          const medals = ["🥇", "🥈", "🥉"];
          let leaderboardText = `🏆 *Weekly Leaderboard*\n\nTop students this week:\n\n`;

          for (let i = 0; i < topStudents.length; i++) {
            const user = await prisma.user.findUnique({
              where: { id: topStudents[i].userId },
              select: { name: true },
            });
            const name = user?.name?.split(" ")[0] || "Student";
            leaderboardText += `${medals[i]} ${name} — ${topStudents[i]._sum.points?.toLocaleString() || 0} points\n`;
          }

          leaderboardText += `\n_Think you can beat them? Take today's daily challenge: zimmaths.com/daily_`;
          postContent = leaderboardText;
        }
        break;
      }

      default:
        return res.json({ success: false, error: "Invalid content type" });
    }

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

// POST /api/admin/whatsapp/post — Mark a post as posted
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