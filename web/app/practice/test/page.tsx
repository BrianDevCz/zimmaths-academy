"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function PracticeTestPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const stored = sessionStorage.getItem("practiceQuestions");
    const settings = sessionStorage.getItem("practiceSettings");
    if (!stored) {
      router.push("/practice");
      return;
    }
    const qs = JSON.parse(stored);
    setQuestions(qs);
    if (settings) {
      const s = JSON.parse(settings);
      setTimeLeft(parseInt(s.count) * 60);
    }
  }, [router]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  const currentQuestion = questions[currentIndex];
  const progress =
    questions.length > 0
      ? Math.round(((currentIndex + 1) / questions.length) * 100)
      : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m + ":" + (s < 10 ? "0" + s : s);
  };

  const handleAnswer = (value: string) => {
    if (!currentQuestion) return;
    setAnswers({ ...answers, [currentQuestion.id]: value });
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const answersArray = questions.map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] || "",
      }));

      const res = await fetch("http://localhost:5000/api/practice/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          answers: answersArray,
          difficulty: sessionStorage.getItem("practiceSettings")
            ? JSON.parse(sessionStorage.getItem("practiceSettings")!).difficulty
            : "mixed",
          timeTaken: timeLeft,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setResults(data);
        setSubmitted(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Results Screen
  if (submitted && results) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-10 px-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Practice Complete!</h1>
          <p className="text-brand-200">Here are your results</p>
        </section>

        <section className="max-w-2xl mx-auto px-6 py-10 space-y-6">

          {/* Score Card */}
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 text-center">
            <div
              className={
                "text-7xl font-bold mb-2 " +
                (results.data?.summary?.scorePercentage >= 70
                  ? "text-green-500"
                  : results.data?.summary?.scorePercentage >= 50
                  ? "text-yellow-500"
                  : "text-red-500")
              }
            >
              {results.data?.summary?.scorePercentage}%
            </div>
            <p className="text-gray-600 text-xl mb-4">
              {results.data?.summary?.correctCount} out of {results.data?.summary?.totalQuestions} correct
            </p>
            <div
              className={
                "inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 " +
                (results.data?.summary?.scorePercentage >= 70
                  ? "bg-green-100 text-green-700"
                  : results.data?.summary?.scorePercentage >= 50
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700")
              }
            >
              {results.data?.summary?.scorePercentage >= 70
                ? "Excellent work!"
                : results.data?.summary?.scorePercentage >= 50
                ? "Good effort — keep practising!"
                : "Keep studying — you can do it!"}
            </div>

            {/* Points Awarded */}
            {results.data?.summary?.pointsAwarded > 0 && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mt-2">
                <p className="text-brand-700 font-bold text-lg">
                  +{results.data?.summary?.pointsAwarded} points earned! 🏆
                </p>
                <p className="text-brand-600 text-sm">
                  Check your rank on the leaderboard
                </p>
              </div>
            )}
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Review Answers</h2>
            {results.data?.results?.map((result: any, index: number) => (
              <div
                key={result.questionId}
                className={
                  "bg-white rounded-2xl shadow p-6 border-l-4 " +
                  (result.isCorrect ? "border-green-500" : "border-red-500")
                }
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={
                      "text-sm font-semibold px-2 py-0.5 rounded " +
                      (result.isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700")
                    }
                  >
                    {result.isCorrect ? "✓ Correct" : "✗ Wrong"}
                  </span>
                  <span className="text-sm text-gray-500">
                    Q{index + 1} — {result.topic}
                  </span>
                </div>
                <p className="text-gray-800 mb-3">{result.questionText}</p>
                <div className="space-y-1 text-sm">
                  <p className="text-gray-600">
                    Your answer:{" "}
                    <span
                      className={
                        result.isCorrect
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {result.userAnswer || "No answer given"}
                    </span>
                  </p>
                  {!result.isCorrect && result.correctAnswer && (
                    <p className="text-gray-600">
                      Correct answer:{" "}
                      <span className="text-green-600 font-medium">
                        {result.correctAnswer}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.push("/practice")}
              className="flex-1 bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-bold transition"
            >
              New Practice Test
            </button>
            <button
              onClick={() => router.push("/leaderboard")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition"
            >
              View Leaderboard
            </button>
          </div>

        </section>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading questions...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Progress Bar */}
      <div className="bg-brand-800 text-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-brand-200">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span
              className={
                "text-sm font-semibold " +
                (timeLeft < 60 ? "text-red-300" : "text-brand-200")
              }
            >
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
          <div className="w-full bg-brand-900 rounded-full h-2">
            <div
              className="bg-brand-300 h-2 rounded-full transition-all"
              style={{ width: progress + "%" }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <section className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 mb-6">

          {/* Question Meta */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded font-medium">
              {currentQuestion?.topic?.name}
            </span>
            <span
              className={
                "text-xs px-2 py-1 rounded capitalize font-medium " +
                (currentQuestion?.difficulty === "easy"
                  ? "bg-green-100 text-green-700"
                  : currentQuestion?.difficulty === "hard"
                  ? "bg-red-100 text-red-700"
                  : "bg-yellow-100 text-yellow-700")
              }
            >
              {currentQuestion?.difficulty}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {currentQuestion?.marks} marks
            </span>
          </div>

          {/* Question Text */}
          <p className="text-gray-800 text-xl leading-relaxed mb-6">
            {currentQuestion?.questionText}
          </p>

          {/* Answer Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your Answer
            </label>
            <textarea
              value={answers[currentQuestion?.id] || ""}
              onChange={(e) => handleAnswer(e.target.value)}
              placeholder="Type your answer here... Show your working!"
              rows={4}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 py-3 rounded-lg font-semibold border border-gray-200 transition"
          >
            Previous
          </button>

          {currentIndex < questions.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex-1 bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-green-300 text-white py-3 rounded-lg font-bold transition"
            >
              {loading ? "Submitting..." : "Submit Test"}
            </button>
          )}
        </div>

        {/* Submit from any question */}
        {currentIndex < questions.length - 1 && (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-300 text-white py-3 rounded-lg font-bold transition"
          >
            {loading ? "Submitting..." : "Submit Test Early"}
          </button>
        )}

        {/* Question dots */}
        <div className="flex gap-2 justify-center mt-6 flex-wrap">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={
                "w-8 h-8 rounded-full text-xs font-bold transition " +
                (i === currentIndex
                  ? "bg-brand-700 text-white"
                  : answers[q.id]
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-600")
              }
            >
              {i + 1}
            </button>
          ))}
        </div>

      </section>
    </main>
  );
}