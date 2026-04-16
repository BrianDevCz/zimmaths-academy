"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect } from "react";
import MathContent from "../components/MathContent";
import MathKeyboard from "../components/MathKeyboard";

export default function DailyChallengePage() {
  const [challenge, setChallenge] = useState<any>(null);
  const [yesterday, setYesterday] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    fetchChallenge();
    fetchYesterday();
    const submittedToday = localStorage.getItem("dailySubmitted");
    const today = new Date().toDateString();
    if (submittedToday === today) setSubmitted(true);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(hours + "h " + minutes + "m " + seconds + "s");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchChallenge = async () => {
    try {
      const res = await fetch(`${API_URL}/api/daily/today`);
      const data = await res.json();
      if (data.success) setChallenge(data.data);
    } catch {
      setError("Failed to load today's challenge");
    } finally {
      setLoading(false);
    }
  };

  const fetchYesterday = async () => {
    try {
      const res = await fetch(`${API_URL}/api/daily/yesterday`);
      const data = await res.json();
      if (data.success) setYesterday(data.data);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!answer.trim()) {
      setError("Please enter your answer");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/api/daily/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, userAnswer: answer }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        localStorage.setItem("dailySubmitted", new Date().toDateString());
        localStorage.setItem("dailyAnswer", answer);
      } else {
        setError(data.message || "Failed to submit");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧮</div>
          <p className="text-gray-500 text-lg">Loading today's challenge...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold mb-2">Daily Challenge</h1>
        <p className="text-brand-200 text-lg">A new maths question every day</p>
        <div className="mt-4 inline-block bg-brand-700 px-6 py-2 rounded-full">
          <span className="text-brand-200 text-sm">New challenge in: </span>
          <span className="text-white font-bold">{timeLeft}</span>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {/* Today's Challenge */}
        {challenge ? (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Today's Challenge</h2>
              <span className="text-sm text-gray-400">
                {new Date().toLocaleDateString("en-GB", {
                  weekday: "long", day: "numeric", month: "long",
                })}
              </span>
            </div>

            {/* Topic Badge */}
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
                {challenge.question?.topic?.name}
              </span>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {challenge.question?.difficulty}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {challenge.question?.marks} marks
              </span>
            </div>

            {/* Question with MathContent */}
            <div className="text-gray-800 text-xl leading-relaxed mb-6">
              <MathContent>{challenge.question?.questionText || ""}</MathContent>
            </div>

            {/* Answer Section */}
            {submitted ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-3xl mb-2">✅</div>
                  <p className="text-green-700 font-semibold text-lg">Answer submitted!</p>
                  <p className="text-green-600 text-sm mt-1">
                    Your answer: <strong>{localStorage.getItem("dailyAnswer")}</strong>
                  </p>
                  <p className="text-green-600 text-sm mt-1">
                    Come back tomorrow to see the solution!
                  </p>
                </div>
                
                <a
                  href={
                    "https://wa.me/?text=I just attempted today's ZimMaths Daily Challenge! Can you solve it? " +
                    encodeURIComponent(challenge.question?.questionText || "") +
                    " Try it at zimmaths.com/daily"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center bg-green-500 hover:bg-green-400 text-white py-3 rounded-lg font-semibold transition"
                >
                  Share on WhatsApp
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Answer
                  </label>
                  <MathKeyboard
                    value={answer}
                    onChange={setAnswer}
                    placeholder="Tap buttons below or type your answer..."
                  />
                </div>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-3 rounded-lg font-bold text-lg transition"
                >
                  {submitting ? "Submitting..." : "Submit Answer"}
                </button>
                
                <a
                  href={
                    "https://wa.me/?text=Can you solve today's ZimMaths Daily Challenge? " +
                    encodeURIComponent(challenge.question?.questionText || "") +
                    " Try it at zimmaths.com/daily"
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center border border-green-500 text-green-600 hover:bg-green-50 py-3 rounded-lg font-semibold transition"
                >
                  Share Challenge on WhatsApp
                </a>
              </div>
            )}

            {/* Stats */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-brand-800">{challenge.totalAttempts || 0}</p>
                <p className="text-xs text-gray-400">Students attempted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{challenge.correctAttempts || 0}</p>
                <p className="text-xs text-gray-400">Got it correct</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-10 text-center border border-gray-200">
            <div className="text-4xl mb-4">🔧</div>
            <p className="text-gray-500 text-lg">No challenge available today. Check back soon!</p>
          </div>
        )}

        {/* Yesterday's Challenge */}
        {yesterday && (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              Yesterday's Challenge — Solution
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              {new Date(Date.now() - 86400000).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
            <div className="text-gray-800 text-lg mb-4 leading-relaxed">
              <MathContent>{yesterday.question?.questionText || ""}</MathContent>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-sm font-semibold text-brand-700 mb-2">Solution</p>
              <div className="text-gray-800">
                <MathContent>{yesterday.question?.solutionText || ""}</MathContent>
              </div>
            </div>
            <div className="mt-4 flex gap-8 text-center">
              <div>
                <p className="text-xl font-bold text-brand-800">{yesterday.totalAttempts || 0}</p>
                <p className="text-xs text-gray-400">Attempted</p>
              </div>
              <div>
                <p className="text-xl font-bold text-brand-800">{yesterday.correctAttempts || 0}</p>
                <p className="text-xs text-gray-400">Got it correct</p>
              </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}