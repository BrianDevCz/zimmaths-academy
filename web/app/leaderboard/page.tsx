"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarColour: string;
  grade: string;
  points: number;
}

export default function LeaderboardPage() {
  const { token, user } = useAuth();
  const [period, setPeriod] = useState<"weekly" | "monthly" | "alltime">("weekly");
  const [board, setBoard] = useState<LeaderboardEntry[]>([]);
  const [myRank, setMyRank] = useState<{ rank: number; points: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (token) {
    fetchLeaderboard(period);
     }
    }, [period, token]);

  const fetchLeaderboard = async (p: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`http://localhost:5000/api/leaderboard/${p}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBoard(data.data);
        setMyRank(data.myRank);
      } else {
        setError("Failed to load leaderboard.");
      }
    } catch (err) {
      setError("Cannot connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const periodLabels = {
    weekly: "This Week",
    monthly: "This Month",
    alltime: "All Time",
  };

  const medalColour = (rank: number) => {
    if (rank === 1) return "bg-yellow-400 text-yellow-900";
    if (rank === 2) return "bg-gray-300 text-gray-700";
    if (rank === 3) return "bg-amber-600 text-white";
    return "bg-brand-100 text-brand-800";
  };

  const top3 = board.slice(0, 3);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <div className="text-5xl mb-3">🏆</div>
        <h1 className="text-3xl font-bold mb-2">Leaderboard</h1>
        <p className="text-brand-200">Top students competing for ZIMSEC Maths glory</p>
      </section>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Period Tabs */}
        <div className="flex bg-white rounded-xl border border-gray-200 p-1 mb-6 shadow-sm">
          {(["weekly", "monthly", "alltime"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition ${
                period === p
                  ? "bg-brand-700 text-white"
                  : "text-gray-500 hover:text-brand-700"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>

        {/* My Rank Banner */}
        {myRank && (
          <div className="bg-brand-50 border border-brand-200 rounded-xl px-5 py-4 mb-6 flex justify-between items-center">
            <div>
              <p className="text-sm text-brand-600 font-medium">Your ranking</p>
              <p className="text-2xl font-bold text-brand-800">
                #{myRank.rank}
                <span className="text-sm font-normal text-brand-600 ml-2">
                  {periodLabels[period]}
                </span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-brand-600 font-medium">Your points</p>
              <p className="text-2xl font-bold text-brand-800">{myRank.points}</p>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl h-16 animate-pulse border border-gray-100" />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && board.length === 0 && (
          <div className="bg-white rounded-2xl shadow p-10 text-center border border-gray-200">
            <p className="text-4xl mb-3">🏅</p>
            <p className="text-gray-600 font-semibold">No entries yet</p>
            <p className="text-gray-400 text-sm mt-1">
              Be the first to earn points and claim the top spot!
            </p>
            <a
              href="/practice"
              className="inline-block mt-4 bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold text-sm"
            >
              Start Earning Points
            </a>
          </div>
        )}

        {/* Leaderboard */}
        {!loading && board.length > 0 && (
          <div className="space-y-3">
            {/* Top 3 Podium */}
            {top3.length === 3 && (
              <div className="flex items-end justify-center gap-4 mb-6 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                {/* 2nd place */}
                <div className="text-center flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg mx-auto mb-2"
                    style={{ backgroundColor: top3[1].avatarColour }}
                  >
                    {top3[1].name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 truncate">{top3[1].name.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400">{top3[1].points} pts</p>
                  <div className="bg-gray-200 h-16 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl">🥈</span>
                  </div>
                </div>

                {/* 1st place */}
                <div className="text-center flex-1">
                  <div className="text-2xl mb-1">👑</div>
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-bold text-white text-xl mx-auto mb-2 ring-4 ring-yellow-400"
                    style={{ backgroundColor: top3[0].avatarColour }}
                  >
                    {top3[0].name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 truncate">{top3[0].name.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400">{top3[0].points} pts</p>
                  <div className="bg-yellow-400 h-24 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl">🥇</span>
                  </div>
                </div>

                {/* 3rd place */}
                <div className="text-center flex-1">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-lg mx-auto mb-2"
                    style={{ backgroundColor: top3[2].avatarColour }}
                  >
                    {top3[2].name.charAt(0).toUpperCase()}
                  </div>
                  <p className="text-sm font-semibold text-gray-700 truncate">{top3[2].name.split(" ")[0]}</p>
                  <p className="text-xs text-gray-400">{top3[2].points} pts</p>
                  <div className="bg-amber-600 h-10 rounded-t-lg mt-2 flex items-center justify-center">
                    <span className="text-2xl">🥉</span>
                  </div>
                </div>
              </div>
            )}

            {/* Full List */}
            {board.map((entry) => (
              <div
                key={entry.userId}
                className={`bg-white rounded-xl border px-5 py-4 flex items-center gap-4 shadow-sm transition ${
                  entry.userId === user?.id
                    ? "border-brand-400 bg-brand-50"
                    : "border-gray-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${medalColour(entry.rank)}`}>
                  {entry.rank === 1 ? "🥇" : entry.rank === 2 ? "🥈" : entry.rank === 3 ? "🥉" : entry.rank}
                </div>

                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: entry.avatarColour }}
                >
                  {entry.name.charAt(0).toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 truncate">
                    {entry.name}
                    {entry.userId === user?.id && (
                      <span className="ml-2 text-xs text-brand-600 font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 capitalize">
                    {entry.grade.replace("form", "Form ")}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-bold text-brand-800">{entry.points}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}