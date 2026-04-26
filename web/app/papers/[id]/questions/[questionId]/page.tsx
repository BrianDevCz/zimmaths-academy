"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import MathContent from "../../../../components/MathContent";
import BookmarkButton from "@/app/components/BookmarkButton";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";

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
          <a href={"/papers/" + id} className="text-brand-700 hover:underline">Back to Paper</a>
        </div>
      </main>
    );
  }

  const canViewSolution = question.isFree || isPremium;

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <a href={"/papers/" + id} className="text-brand-300 hover:text-white text-sm mb-4 inline-block">
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
                  <span className="bg-green-500 text-white text-xs px-2 py-0.5 rounded">Premium</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Question */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3">Question</h2>
          <div className="text-gray-800 text-xl leading-relaxed">
            <MathContent>{question.questionText || ""}</MathContent>
          </div>
          {question.questionImageUrl && (
            <img src={question.questionImageUrl} alt="Question diagram"
              className="mt-4 max-w-full max-h-80 rounded-lg border border-gray-200 object-contain" />
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
                  <p className="text-gray-500 mb-2">You need a premium subscription to view solutions.</p>
                  <p className="text-gray-400 text-sm mb-6">Unlock full step-by-step solutions for all 50 papers.</p>
                  <a href="/upgrade" className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block">
                    Upgrade from $3
                  </a>
                </div>
              ) : (
                <div>
                  <p className="text-gray-500 mb-6">Sign in and upgrade to view full step-by-step solutions.</p>
                  <div className="flex gap-3 justify-center">
                    <a href="/login" className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-bold transition inline-block">Sign In</a>
                    <a href="/register" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold transition inline-block">Register</a>
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
            <button
              onClick={() => {
                const topic = question.topic?.name || "Maths";
                const shareUrl = `https://zimmaths.com/share/${question.id}`;
                const message = `🧮 *Can you solve this ${topic} question?*\n\nSomeone challenged you with this ZIMSEC O-Level ${topic} question. Think you can solve it?\n\n👉 ${shareUrl}\n\n📚 Join ZimMaths — Zimbabwe's #1 Maths platform!`;
                window.open(
                  `https://wa.me/?text=${encodeURIComponent(message)}`,
                  "_blank"
                );
              }}
              className="flex items-center gap-2 bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share on WhatsApp
            </button>
          </div>
        </div>

      </section>
    </main>
  );
}