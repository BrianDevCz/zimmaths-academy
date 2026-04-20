"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";

interface Badge {
  slug: string;
  name: string;
  description: string;
  icon: string;
  earned: boolean;
  awardedAt: string | null;
}

export default function BadgesPage() {
  const { token, loading: authLoading } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !token) return;
    fetchBadges();
  }, [token, authLoading]);

  const fetchBadges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/badges`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBadges(data.data);
        setEarnedCount(data.earnedCount);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading badges...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">🏅 My Badges</h1>
          <p className="text-brand-200">
            {earnedCount} of {badges.length} badges earned
          </p>
          {/* Progress bar */}
          <div className="mt-4 w-full bg-brand-700 rounded-full h-3">
            <div
              className="bg-yellow-400 h-3 rounded-full transition-all"
              style={{ width: `${(earnedCount / badges.length) * 100}%` }}
            />
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {/* Earned badges */}
        {earnedCount > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4">✅ Earned ({earnedCount})</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {badges.filter((b) => b.earned).map((badge) => (
                <div key={badge.slug}
                  className="bg-white rounded-2xl shadow p-5 border-2 border-yellow-300 text-center hover:shadow-md transition">
                  <div className="text-5xl mb-3">{badge.icon}</div>
                  <h3 className="font-bold text-gray-800 text-sm mb-1">{badge.name}</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">{badge.description}</p>
                  {badge.awardedAt && (
                    <p className="text-yellow-600 text-xs mt-2 font-medium">
                      Earned {new Date(badge.awardedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked badges */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            🔒 Locked ({badges.length - earnedCount})
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.filter((b) => !b.earned).map((badge) => (
              <div key={badge.slug}
                className="bg-white rounded-2xl shadow p-5 border border-gray-200 text-center opacity-60">
                <div className="text-5xl mb-3 grayscale">{badge.icon}</div>
                <h3 className="font-bold text-gray-600 text-sm mb-1">{badge.name}</h3>
                <p className="text-gray-400 text-xs leading-relaxed">{badge.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
