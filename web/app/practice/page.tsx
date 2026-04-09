"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

const topics = [
  { slug: "mixed", name: "Mixed — All Topics", icon: "🎯" },
  { slug: "general-arithmetic", name: "General Arithmetic", icon: "🔢" },
  { slug: "algebra", name: "Algebra", icon: "📐" },
  { slug: "number-bases", name: "Number Bases", icon: "💻" },
  { slug: "sets", name: "Sets", icon: "⭕" },
  { slug: "geometry", name: "Geometry", icon: "📏" },
  { slug: "trigonometry", name: "Trigonometry", icon: "📉" },
  { slug: "mensuration", name: "Mensuration", icon: "📦" },
  { slug: "graphs-variation", name: "Graphs & Variation", icon: "📈" },
  { slug: "statistics", name: "Statistics", icon: "📊" },
  { slug: "probability", name: "Probability", icon: "🎲" },
  { slug: "matrices-transformations", name: "Matrices & Transformations", icon: "🔄" },
  { slug: "vectors", name: "Vectors", icon: "➡️" },
  { slug: "coordinate-geometry", name: "Coordinate Geometry", icon: "📍" },
  { slug: "financial-mathematics", name: "Financial Mathematics", icon: "💰" },
  { slug: "measurement-estimation", name: "Measurement & Estimation", icon: "📏" },
];

export default function PracticePage() {
  const router = useRouter();
  const { token, loading: authLoading } = useAuth();
  const [selectedTopic, setSelectedTopic] = useState("mixed");
  const [difficulty, setDifficulty] = useState("mixed");
  const [count, setCount] = useState("5");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (authLoading || !token) return;
    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/subscriptions/status`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
      .then((r) => r.json())
      .then((d) => { if (d.success && d.isPremium) setIsPremium(true); })
      .catch(() => {});
  }, [token, authLoading]);

  const handleStart = async () => {
    setError("");
    setLoading(true);

    try {
      // Get recently seen question IDs to avoid repeats
      const recentIds: string[] = JSON.parse(
        sessionStorage.getItem("recentQuestionIds") || "[]"
      );

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/practice/generate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            topicSlug: selectedTopic,
            difficulty,
            count: parseInt(count),
            excludeIds: recentIds,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        sessionStorage.setItem("practiceQuestions", JSON.stringify(data.data));
        sessionStorage.setItem("practiceSettings", JSON.stringify({
          topic: selectedTopic,
          difficulty,
          count,
        }));

        // Track recently seen question IDs to avoid repeats (keep last 50)
        const newIds = data.data.map((q: any) => q.id);
        const updatedIds = [...new Set([...recentIds, ...newIds])].slice(-50);
        sessionStorage.setItem("recentQuestionIds", JSON.stringify(updatedIds));

        router.push("/practice/test");
      } else {
        setError(data.error || "Failed to generate test. Try different filters.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Smart Practice Mode</h1>
        <p className="text-brand-200 text-lg">
          Generate instant practice tests from our question bank
        </p>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-10">
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">

          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Set Up Your Practice Test
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
              ⚠️ {error}
              {!isPremium && error.toLowerCase().includes("free") && (
                <span className="ml-1">
                  <a href="/upgrade" className="underline font-semibold">
                    Upgrade to unlock all questions.
                  </a>
                </span>
              )}
            </div>
          )}

          {/* Free vs Premium notice */}
          {!isPremium && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-yellow-800 font-medium">
                🔒 Free plan: practice with free questions only
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                <a href="/upgrade" className="underline font-semibold">
                  Upgrade from $3
                </a>{" "}
                to unlock all questions across all topics.
              </p>
            </div>
          )}

          {isPremium && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-sm text-green-800 font-medium">
                ✓ Premium — full access to all questions
              </p>
            </div>
          )}

          {/* Topic Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Topic
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
              {topics.map((topic) => (
                <button
                  key={topic.slug}
                  onClick={() => setSelectedTopic(topic.slug)}
                  className={
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition text-left " +
                    (selectedTopic === topic.slug
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300")
                  }
                >
                  <span>{topic.icon}</span>
                  <span className="truncate">{topic.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Difficulty
            </label>
            <div className="flex gap-3">
              {["mixed", "easy", "medium", "hard"].map((d) => (
                <button
                  key={d}
                  onClick={() => setDifficulty(d)}
                  className={
                    "flex-1 py-2 rounded-lg text-sm font-semibold capitalize border transition " +
                    (difficulty === d
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300")
                  }
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Number of Questions
            </label>
            <div className="flex gap-3">
              {["5", "10", "20"].map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  className={
                    "flex-1 py-2 rounded-lg text-sm font-semibold border transition " +
                    (count === n
                      ? "bg-brand-700 text-white border-brand-700"
                      : "bg-white text-gray-700 border-gray-200 hover:border-brand-300")
                  }
                >
                  {n} Questions
                </button>
              ))}
            </div>
          </div>

          {/* Points Info */}
          <div className="bg-brand-50 border border-brand-100 rounded-lg px-4 py-3 mb-6">
            <p className="text-sm text-brand-700 font-medium">🏆 Points you can earn:</p>
            <div className="flex gap-4 mt-1 text-xs text-brand-600">
              <span>5 questions = 10 pts</span>
              <span>10 questions = 25 pts</span>
              <span>20 questions = 55 pts</span>
            </div>
            <p className="text-xs text-brand-600 mt-1">
              Score 80%+ for bonus points!
            </p>
          </div>

          {/* Start Button */}
          <button
            onClick={handleStart}
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-4 rounded-lg font-bold text-lg transition"
          >
            {loading ? "Generating Test..." : "Start Practice Test"}
          </button>

        </div>
      </section>

    </main>
  );
}
