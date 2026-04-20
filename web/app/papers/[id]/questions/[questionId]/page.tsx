"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import MathContent from "../../../../components/MathContent";
import BookmarkButton from "@/app/components/BookmarkButton";
import { API_URL } from "@/app/lib/api";

export default function QuestionPage() {
  const { id, questionId } = useParams<{ id: string; questionId: string }>();
  const { token, loading: authLoading, isPremium } = useAuth();

  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const qRes = await fetch(`${API_URL}/api/questions/${questionId}`, { headers });
        const qData = await qRes.json();
        if (qData.success) setQuestion(qData.data);
      } catch (err) {
        console.error("Failed to load question:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [questionId, token, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Question not found</h1>
          <a href={"/papers/" + id} className="text-brand-700 hover:underline">
            Back to Paper
          </a>
        </div>
      </main>
    );
  }

  const canViewSolution = question.isFree || isPremium;

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <a
            href={"/papers/" + id}
            className="text-brand-300 hover:text-white text-sm mb-4 inline-block"
          >
            ← Back to Paper
          </a>
          <div className="flex items-center gap-4 mt-2">
            <span className="bg-white text-brand-800 w-12 h-12 rounded-full flex items-center justify-center font-bold">
              Q{question.questionNumber}
            </span>
            <div>
              <p className="text-brand-200 text-sm">{question.topic?.name}</p>
              <div className="flex gap-2 mt-1">
                <span className="bg-brand-700 text-white text-xs px-2 py-0.5 rounded capitalize">
                  {question.difficulty}
                </span>
                <span className="bg-brand-700 text-white text-xs px-2 py-0.5 rounded">
                  {question.marks} marks
                </span>
                {isPremium && (
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">
                    Premium
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Question */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3">
            Question
          </h2>
          <div className="text-gray-800 text-xl leading-relaxed">
            <MathContent>{question.questionText || ""}</MathContent>
          </div>
          {question.questionImageUrl && (
            <img
              src={question.questionImageUrl}
              alt="Question diagram"
              className="mt-4 max-w-full max-h-80 rounded-lg border border-gray-200 object-contain"
            />
          )}
        </div>

        {/* Solution */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-4">
            Step-by-Step Solution
          </h2>

          {canViewSolution ? (
            <div className="space-y-4">
              {question.correctAnswer && (
                <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                  <h3 className="text-sm font-semibold text-green-700 mb-1">Answer</h3>
                  <div className="text-green-800 font-medium">
                    <MathContent>{question.correctAnswer}</MathContent>
                  </div>
                </div>
              )}

              {question.solutionText && (
                <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                  <h3 className="text-sm font-semibold text-brand-700 mb-2">Full Working</h3>
                  <div className="text-gray-800 leading-relaxed">
                    <MathContent>{question.solutionText}</MathContent>
                  </div>
                </div>
              )}

              {question.solutionSteps && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Step-by-Step</h3>
                  <div className="text-gray-800 leading-relaxed text-sm">
                    <MathContent>{question.solutionSteps}</MathContent>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100">
                <h3 className="text-sm font-semibold text-yellow-700 mb-1">Marking Scheme</h3>
                <p className="text-yellow-800 text-sm">
                  This question is worth {question.marks} mark{question.marks !== 1 ? "s" : ""}.
                  Show all working clearly to earn full marks.
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Premium Solution</h3>
              {token ? (
                <div>
                  <p className="text-gray-500 mb-2">
                    You need a premium subscription to view solutions.
                  </p>
                  <p className="text-gray-400 text-sm mb-6">
                    Unlock full step-by-step solutions for all 50 papers.
                  </p>
                  <a
                    href="/upgrade"
                    className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block"
                  >
                    Upgrade from $3
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-6">
                    Sign in and upgrade to view full step-by-step solutions.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <a
                      href="/login"
                      className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition inline-block"
                    >
                      Sign In
                    </a>
                    <a
                      href="/register"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition inline-block"
                    >
                      Register
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <div className="flex gap-3 justify-center flex-wrap">
            <BookmarkButton questionId={question.id} />
            <a
              href={
                "https://wa.me/?text=Can you solve this ZIMSEC Maths question? " +
                encodeURIComponent(question.questionText) +
                " - See solution at zimmaths.com"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
            >
              📤 Share on WhatsApp
            </a>
          </div>
        </div>

      </section>
    </main>
  );
}
