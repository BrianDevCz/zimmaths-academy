"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError("Failed to load dashboard.");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const getScoreColour = (score: number) => {
    if (score >= 70) return "text-green-600";
    if (score >= 50) return "text-yellow-600";
    return "text-red-600";
  };

  const getBarColour = (score: number) => {
    if (score >= 70) return "bg-green-500";
    if (score >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading your dashboard...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">⚠️ {error}</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold"
          >
            Log In
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user?.avatarColour || "#1565C0" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back, {user?.name?.split(" ")[0]}! 👋
            </h1>
            <p className="text-brand-200 capitalize">
              {user?.grade?.replace("form", "Form ")} · ZimMaths Academy
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              label: "Total Points",
              value: data?.stats?.totalPoints || 0,
              icon: "🏆",
              colour: "bg-yellow-50 border-yellow-200",
              textColour: "text-yellow-700",
            },
            {
              label: "Weekly Points",
              value: data?.stats?.weeklyPoints || 0,
              icon: "📅",
              colour: "bg-brand-50 border-brand-200",
              textColour: "text-brand-700",
            },
            {
              label: "Weekly Rank",
              value: "#" + (data?.stats?.weeklyRank || "-"),
              icon: "🎖️",
              colour: "bg-purple-50 border-purple-200",
              textColour: "text-purple-700",
            },
            {
              label: "Avg Score",
              value: (data?.stats?.averageScore || 0) + "%",
              icon: "📊",
              colour: "bg-green-50 border-green-200",
              textColour: "text-green-700",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-white rounded-2xl border p-5 ${stat.colour}`}
            >
              <div className="text-2xl mb-2">{stat.icon}</div>
              <p className={`text-2xl font-bold ${stat.textColour}`}>
                {stat.value}
              </p>
              <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Weak Topics Alert */}
        {data?.weakTopics?.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6">
            <h2 className="text-lg font-bold text-orange-800 mb-4">
              ⚠️ Focus Areas — Your Weakest Topics
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {data.weakTopics.map((t: any) => (
                <div
                  key={t.topic}
                  className="bg-white rounded-xl p-4 border border-orange-100"
                >
                  <p className="font-semibold text-gray-800">{t.topic}</p>
                  <p className="text-2xl font-bold text-red-500 mt-1">
                    {t.percentage}%
                  </p>
                  <p className="text-xs text-gray-400">
                    {t.correct}/{t.total} correct
                  </p>
                  <a
                    href="/practice"
                    className="block mt-3 text-center bg-orange-100 hover:bg-orange-200 text-orange-700 text-sm font-semibold py-2 rounded-lg transition"
                  >
                    Practise Now
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Topic Performance */}
        {data?.topicPerformance?.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              📚 Performance by Topic
            </h2>
            <div className="space-y-4">
              {data.topicPerformance.map((t: any) => (
                <div key={t.topic}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {t.topic}
                    </span>
                    <span
                      className={`text-sm font-bold ${getScoreColour(t.percentage)}`}
                    >
                      {t.percentage}%
                      <span className="text-gray-400 font-normal ml-1 text-xs">
                        ({t.correct}/{t.total})
                      </span>
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${getBarColour(t.percentage)}`}
                      style={{ width: t.percentage + "%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Score Trend */}
        {data?.scoreTrend?.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-6">
              📈 Recent Test Scores
            </h2>
            <div className="flex items-end gap-2 h-40 px-2">
  {data.scoreTrend.map((t: any, i: number) => (
    <div key={i} className="flex-1 flex flex-col items-center gap-1">
      <span className={`text-xs font-bold ${getScoreColour(t.score)}`}>
        {t.score}%
      </span>
      <div className="w-full bg-gray-100 rounded-lg h-28 flex items-end">
        <div
          className={`w-full rounded-lg transition-all ${getBarColour(t.score)}`}
          style={{ height: Math.max(t.score, 4) + "%" }}
        />
      </div>
    </div>
  ))}
</div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Last {data.scoreTrend.length} practice tests
            </p>
          </div>
        )}

        {/* Practice History */}
        {data?.practiceHistory?.length > 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              🕐 Recent Practice Tests
            </h2>
            <div className="space-y-3">
              {data.practiceHistory.map((test: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {test.questionCount} questions · {test.difficulty}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(test.completedAt).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div
                    className={`text-lg font-bold ${getScoreColour(test.scorePercentage)}`}
                  >
                    {test.scorePercentage}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {data?.stats?.testsCompleted === 0 && (
          <div className="bg-white rounded-2xl shadow border border-gray-200 p-10 text-center">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-gray-600 font-semibold text-lg">
              No practice tests yet
            </p>
            <p className="text-gray-400 text-sm mt-1 mb-6">
              Complete a practice test to see your performance analytics here
            </p>
            <a
              href="/practice"
              className="inline-block bg-brand-700 text-white px-8 py-3 rounded-lg font-bold transition hover:bg-brand-600"
            >
              Start Practising
            </a>
          </div>
        )}

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { href: "/practice", icon: "✏️", label: "Practice" },
            { href: "/papers", icon: "📄", label: "Papers" },
            { href: "/topics", icon: "📚", label: "Topics" },
            { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:border-brand-300 hover:shadow-sm transition"
            >
              <div className="text-3xl mb-2">{link.icon}</div>
              <p className="text-sm font-semibold text-gray-700">{link.label}</p>
            </a>
          ))}
        </div>

      </div>
    </main>
  );
}