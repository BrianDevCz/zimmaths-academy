"use client";
import MathContent from "../../components/MathContent";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { API_URL } from "@/app/lib/api";

export default function QuestionCard({
  question,
  paperId,
}: {
  question: any;
  paperId: string;
}) {
  const { token, isPremium } = useAuth();

  const canAccess = question.isFree || isPremium;

  return (
    <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition">

      {/* Question Header */}
      <div className="flex items-center gap-3 mb-4">
        <span className="bg-brand-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
          Q{question.questionNumber}
        </span>
        <div>
          <span className="text-xs text-gray-400">{question.topic?.name}</span>
          <div className="flex gap-2 mt-1 flex-wrap">
            <span className={
              "text-xs px-2 py-0.5 rounded capitalize " +
              (question.difficulty === "easy"
                ? "bg-green-100 text-green-700"
                : question.difficulty === "hard"
                ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700")
            }>
              {question.difficulty}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              {question.marks} marks
            </span>
            {question.isFree ? (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-semibold">
                Free
              </span>
            ) : (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded font-semibold">
                Premium
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Question Text */}
      <div className="text-gray-800 text-lg mb-4 leading-relaxed">
        <MathContent>{question.questionText || ""}</MathContent>
      </div>

      {/* Question Image */}
      {question.questionImageUrl && (
        <img
          src={question.questionImageUrl}
          alt="Question diagram"
          className="max-w-full max-h-96 rounded-lg border border-gray-200 object-contain mb-4"
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 flex-wrap">
        {canAccess ? (
          <Link
            href={`/papers/${paperId}/questions/${question.id}`}
            className="bg-brand-700 hover:bg-brand-600 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            View Solution
          </Link>
        ) : token ? (
          <Link
            href="/upgrade"
            className="bg-yellow-500 hover:bg-yellow-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            🔒 Upgrade to View Solution
          </Link>
        ) : (
          <Link
            href="/login"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-5 py-2 rounded-lg text-sm font-semibold transition"
          >
            🔒 Sign in to View Solution
          </Link>
        )}

        <a
          href={`https://wa.me/?text=Can you solve this ZIMSEC Maths question? ${encodeURIComponent(question.questionText)} - See solution at zimmaths.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-green-500 hover:bg-green-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition"
        >
          Share on WhatsApp
        </a>
      </div>
    </div>
  );
}
