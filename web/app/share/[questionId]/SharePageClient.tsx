"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";

export default function SharePageClient({ questionId }: { questionId: string }) {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!questionId) return;
    fetch(`${API_URL}/api/questions/${questionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setQuestion(data.data);
      })
      .finally(() => setLoading(false));
  }, [questionId]);

  const questionUrl = question?.paperId
    ? `https://zimmaths.com/papers/${question.paperId}/questions/${questionId}`
    : "https://zimmaths.com";

  const difficultyColor =
    question?.difficulty === "easy"
      ? "bg-green-100 text-green-700"
      : question?.difficulty === "hard"
      ? "bg-red-100 text-red-700"
      : "bg-orange-100 text-orange-700";

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-900 to-gray-900 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen bg-gradient-to-b from-brand-900 to-gray-900 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-7xl mb-6">📚</div>
          <h1 className="text-3xl font-bold text-white mb-3">Question Not Found</h1>
          <p className="text-brand-200 mb-8 text-lg">
            This question may have been removed or the link is broken.
          </p>
          <Link
            href="/register"
            className="inline-block bg-brand-500 hover:bg-brand-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg"
          >
            Join ZimMaths — It's Free
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-brand-900 via-brand-900 to-gray-900">
      {/* Top nav */}
      <nav className="px-6 py-4 flex items-center justify-between max-w-4xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-white">ZIM</span>
          <span className="text-xl font-bold text-brand-300">MATHS</span>
          <span className="text-xs text-brand-300">.com</span>
        </Link>
        <Link
          href="/register"
          className="bg-brand-500 hover:bg-brand-400 text-white px-5 py-2 rounded-lg font-semibold text-sm transition"
        >
          Join Free
        </Link>
      </nav>

      {/* Hero */}
      <section className="px-6 pt-8 pb-12 text-center max-w-2xl mx-auto">
        <p className="text-brand-400 text-sm font-semibold mb-3 uppercase tracking-widest">
          📨 Someone challenged you
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight">
          Can you solve this{" "}
          <span className="text-brand-300">{question.topic?.name || "Maths"}</span> question?
        </h1>
        <p className="text-brand-200 text-lg">
          This ZIMSEC O-Level question was shared with you. Think you can crack it?
        </p>
      </section>

      {/* Question card */}
      <section className="max-w-2xl mx-auto px-6 pb-10">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Paper info bar */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex flex-wrap items-center gap-3 text-sm">
            <span className="font-semibold text-gray-700">
              {question.paper?.title || "ZIMSEC Maths"}
            </span>
            <span className="text-gray-400">•</span>
            <span className={`px-3 py-1 rounded-full font-semibold text-xs ${difficultyColor}`}>
              {question.difficulty?.toUpperCase() || "MEDIUM"}
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-gray-600 font-medium">
              {question.marks} mark{question.marks !== 1 ? "s" : ""}
            </span>
            {question.topic?.name && (
              <>
                <span className="text-gray-400">•</span>
                <span className="text-brand-700 font-medium">
                  {question.topic.name}
                </span>
              </>
            )}
          </div>

          {/* Question text */}
          <div className="px-6 md:px-10 py-10">
            <div
              className="text-gray-800 text-lg leading-relaxed"
              dangerouslySetInnerHTML={{ __html: question.questionText || "" }}
            />
          </div>

          {/* Image if present */}
          {question.questionImageUrl && (
            <div className="px-6 pb-6">
              <img
                src={question.questionImageUrl}
                alt="Question diagram"
                className="w-full rounded-xl border border-gray-200"
              />
            </div>
          )}

          {/* CTA */}
          <div className="px-6 pb-8 space-y-3">
            <Link
              href={questionUrl}
              className="block w-full text-center bg-brand-600 hover:bg-brand-500 text-white px-6 py-4 rounded-xl font-bold text-lg transition shadow-md"
            >
              🔓 Solve This Question on ZimMaths
            </Link>
            <p className="text-center text-gray-500 text-sm">
              See the full solution, step-by-step working, and get instant feedback.
            </p>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="max-w-2xl mx-auto px-6 pb-16">
        <div className="bg-brand-800/50 border border-brand-700/50 rounded-2xl p-8 text-center">
          <h2 className="text-xl font-bold text-white mb-3">
            🚀 Join ZimMaths Academy
          </h2>
          <p className="text-brand-200 mb-6 leading-relaxed">
            Zimbabwe's #1 O-Level Maths platform. Practice with ZIMSEC-style questions,
            get instant AI-powered feedback, and track your progress.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-brand-500 hover:bg-brand-400 text-white px-8 py-3 rounded-xl font-bold text-lg transition shadow-lg"
            >
              Get Started — It's Free
            </Link>
            <Link
              href="/papers"
              className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl font-semibold transition border border-white/20"
            >
              Browse More Questions
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center pb-10">
        <p className="text-brand-400 text-sm">
          © 2026 ZimMaths Academy · Built for Zimbabwe's O-Level students
        </p>
      </footer>
    </main>
  );
}