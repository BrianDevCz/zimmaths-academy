"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ProfilePage() {
  const { token, user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ name: "", grade: "" });
  const [saveMessage, setSaveMessage] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login?redirect=/profile");
      return;
    }
    fetchProfileData();
  }, [token, authLoading]);

  const fetchProfileData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [dashRes, subRes] = await Promise.all([
        fetch(`${API_URL}/api/dashboard`, { headers }),
        fetch(`${API_URL}/api/subscriptions/status`, { headers }),
      ]);

      const dashData = await dashRes.json();
      const subData = await subRes.json();

      if (dashData.success) {
        setStats(dashData.data.stats);
        setFormData({
          name: dashData.data.user?.name || user?.name || "",
          grade: dashData.data.user?.grade || user?.grade || "",
        });
      }

      if (subData.success) {
        setSubscription(subData);
      }
    } catch (err) {
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveError("");
    setSaveMessage("");
    try {
      const res = await fetch(`${API_URL}/api/auth/me/update`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage("Profile updated successfully!");
        setEditing(false);
      } else {
        setSaveError(data.error || "Failed to update profile.");
      }
    } catch {
      setSaveError("Cannot connect to server.");
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/");
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto flex items-center gap-5">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user?.avatarColour || "#1565C0" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user?.name}</h1>
            <p className="text-brand-200 capitalize">
              {user?.grade?.replace("form", "Form ")} · ZimMaths Academy
            </p>
            <p className="text-brand-300 text-sm">{user?.email}</p>
          </div>
        </div>
      </section>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Subscription Status */}
        <div className={`rounded-2xl p-6 border ${
          subscription?.isPremium
            ? "bg-yellow-50 border-yellow-200"
            : "bg-gray-50 border-gray-200"
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-gray-800 text-lg">
                {subscription?.isPremium ? "⭐ Premium Member" : "Free Account"}
              </p>
              {subscription?.isPremium ? (
                <p className="text-sm text-yellow-700 mt-1">
                  {subscription.subscription?.plan?.replace("_", " ")} plan ·{" "}
                  {subscription.subscription?.daysLeft} days remaining
                </p>
              ) : (
                <p className="text-sm text-gray-500 mt-1">
                  Upgrade to access all papers, solutions and unlimited AI tutoring
                </p>
              )}
            </div>
            {!subscription?.isPremium && (
              <Link
                href="/upgrade"
                className="bg-brand-700 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold text-sm transition"
              >
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Points", value: stats.totalPoints || 0, icon: "🏆" },
              { label: "Weekly Rank", value: "#" + (stats.weeklyRank || "-"), icon: "🎖️" },
              { label: "Tests Done", value: stats.testsCompleted || 0, icon: "✏️" },
              { label: "Avg Score", value: (stats.averageScore || 0) + "%", icon: "📊" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow p-4 text-center">
                <div className="text-2xl mb-1">{stat.icon}</div>
                <p className="text-xl font-bold text-brand-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Profile Details */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-800">👤 Profile Details</h2>
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="text-sm text-brand-700 hover:text-brand-600 font-semibold"
              >
                Edit
              </button>
            ) : (
              <button
                onClick={() => setEditing(false)}
                className="text-sm text-gray-500 hover:text-gray-700 font-semibold"
              >
                Cancel
              </button>
            )}
          </div>

          {saveMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ✅ {saveMessage}
            </div>
          )}
          {saveError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
              ⚠️ {saveError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Full Name
              </label>
              {editing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500"
                />
              ) : (
                <p className="text-gray-800 px-4 py-3 bg-gray-50 rounded-xl">{user?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <p className="text-gray-500 px-4 py-3 bg-gray-50 rounded-xl">{user?.email}</p>
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Grade
              </label>
              {editing ? (
                <select
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500"
                >
                  <option value="form3">Form 3</option>
                  <option value="form4">Form 4</option>
                </select>
              ) : (
                <p className="text-gray-800 px-4 py-3 bg-gray-50 rounded-xl capitalize">
                  {user?.grade?.replace("form", "Form ")}
                </p>
              )}
            </div>

            {editing && (
              <button
                onClick={handleSave}
                className="w-full bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-xl font-bold transition"
              >
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { href: "/dashboard", icon: "📊", label: "My Dashboard" },
            { href: "/leaderboard", icon: "🏆", label: "Leaderboard" },
            { href: "/practice", icon: "✏️", label: "Practice" },
            { href: "/upgrade", icon: "⭐", label: "Upgrade" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="bg-white rounded-2xl border border-gray-200 p-5 text-center hover:border-brand-300 hover:shadow-sm transition"
            >
              <div className="text-3xl mb-2">{link.icon}</div>
              <p className="text-sm font-semibold text-gray-700">{link.label}</p>
            </Link>
          ))}
        </div>

        {/* Account */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Account</h2>
          <button
            onClick={handleLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-600 py-3 rounded-xl font-semibold transition border border-red-200"
          >
            🚪 Logout
          </button>
        </div>

      </div>
    </main>
  );
}