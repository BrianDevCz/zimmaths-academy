"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/app/lib/api";
import { useAuth } from "@/app/context/AuthContext";
import Link from "next/link";

interface ReferralData {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  paidReferrals: number;
  referrals: {
    id: string;
    name: string;
    joinedAt: string;
    status: "premium" | "free";
  }[];
  rewardTiers: {
    id: string;
    threshold: number;
    months: number;
    label: string;
    unlocked: boolean;
    claimed: boolean;
    remaining: number;
  }[];
}

export default function ReferralsPage() {
  const { token, user, loading: authLoading } = useAuth();
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && token) {
      fetchReferralData();
    } else if (!authLoading && !token) {
      setLoading(false);
    }
  }, [authLoading, token]);

  const fetchReferralData = async () => {
    try {
      setError(null);
      const res = await fetch(`${API_URL}/api/referrals/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        setError("Please log in to view your referrals");
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "Failed to load referral data");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Failed to load referral data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(data.referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback: select the text manually
      const input = document.getElementById("referral-link-input") as HTMLInputElement;
      if (input) {
        input.select();
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      }
    }
  };

  const handleClaim = async (tierId: string) => {
    setClaiming(tierId);
    try {
      const res = await fetch(`${API_URL}/api/referrals/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tierId }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.data.message);
        await fetchReferralData();
      } else {
        alert(json.error || "Failed to claim reward");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setClaiming(null);
    }
  };

  const whatsappMessage = data
    ? encodeURIComponent(
        `Hey! I've been using ZimMaths to practice for O-Level Maths and it's really helping. They have 25 practice papers with full solutions, an AI tutor, and daily challenges.\n\nJoin using my link and we both benefit:\n${data.referralLink}\n\nIt's free to start!`
      )
    : "";

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
    return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Not logged in
  if (!token) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-6">Please log in to view your referrals and start earning rewards.</p>
          <Link
            href="/login"
            className="inline-block bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            Log In
          </Link>
        </div>
      </main>
    );
  }

  // Error state
  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <div className="text-5xl mb-4">⚠️</div>
          <p className="text-gray-500 mb-6">{error}</p>
          <button
            onClick={fetchReferralData}
            className="text-brand-700 hover:underline text-sm font-medium"
          >
            Try Again
          </button>
        </div>
      </main>
    );
  }

  if (!data) return null;

  const firstTier = data.rewardTiers[0];
  const progress = Math.min((data.paidReferrals / firstTier.threshold) * 100, 100);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 text-white py-10 px-6 text-center relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500 rounded-full opacity-15" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-brand-500 rounded-full opacity-10" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/15 rounded-full px-4 py-1.5 text-sm mb-4">
            🎁 Refer &amp; Earn
          </div>
          <h1 className="text-2xl font-extrabold mb-2">Invite Friends, Get Premium Free</h1>
          <p className="text-brand-200 max-w-md mx-auto">
            Share ZimMaths with friends — when 5 of them upgrade to Premium, you get 1 month free
          </p>
        </div>
      </section>

      <div className="max-w-xl mx-auto px-4 -mt-6 pb-10 space-y-4 relative z-10">

        {/* Progress Card */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Paying referrals</p>
              <p className="text-4xl font-extrabold text-gray-900">
                {data.paidReferrals}<span className="text-xl font-normal text-gray-400">/{firstTier.threshold}</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">{data.totalReferrals} total sign-ups</p>
            </div>
            <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-3xl">
              {data.paidReferrals >= firstTier.threshold ? "🎉" : "🎯"}
            </div>
          </div>

          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-700 to-brand-500 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-sm text-gray-500 text-center">
            {firstTier.remaining > 0
              ? `${firstTier.remaining} more paying referral${firstTier.remaining !== 1 ? "s" : ""} to unlock free Premium`
              : "You've earned 1 month of Premium! Claim it below."}
          </p>

          <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: firstTier.threshold }).map((_, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  i < data.paidReferrals
                    ? "bg-brand-700 text-white"
                    : "border-2 border-dashed border-gray-300 text-gray-400"
                }`}
              >
                {i < data.paidReferrals ? "✓" : i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Referral Link */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Referral Link</h2>

          <div className="flex gap-2 mb-4">
            <input
              id="referral-link-input"
              readOnly
              value={data.referralLink}
              className="flex-1 px-3 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:outline-none"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopy}
              className={`px-5 py-3 rounded-xl font-semibold text-sm text-white transition-all ${
                copied ? "bg-green-600" : "bg-brand-700 hover:bg-brand-600"
              }`}
            >
              {copied ? "✓ Copied!" : "Copy"}
            </button>
          </div>

          <a
            href={`https://wa.me/?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-white font-bold text-base transition"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            Share on WhatsApp
          </a>

          <p className="text-xs text-gray-400 mt-3 text-center">
            Your code: <span className="text-brand-700 font-bold">{data.referralCode}</span> — friends can also enter this at registration
          </p>
        </div>

        {/* Referrals List */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Your Referrals</h2>

          {data.referrals.length === 0 ? (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No referrals yet</p>
              <p className="text-xs mt-1">Share your link to get started!</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.referrals.map((ref) => (
                <div
                  key={ref.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-sm">
                      {ref.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{ref.name}</p>
                      <p className="text-xs text-gray-400">Joined {timeAgo(ref.joinedAt)}</p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                      ref.status === "premium"
                        ? "bg-green-50 text-green-700"
                        : "bg-orange-50 text-orange-700"
                    }`}
                  >
                    {ref.status === "premium" ? "Premium" : "Free"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reward Tiers */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-4">🎁 Reward Tiers</h2>
          <div className="space-y-2.5">
            {data.rewardTiers.map((tier) => (
              <div
                key={tier.id}
                className={`flex items-center justify-between p-4 rounded-xl border ${
                  tier.unlocked
                    ? "bg-yellow-50 border-yellow-300"
                    : "bg-gray-50 border-gray-200 opacity-70"
                }`}
              >
                <div>
                  <p className="text-sm font-bold text-gray-800">{tier.label}</p>
                  <p className="text-xs text-gray-500">{tier.threshold} paying students</p>
                </div>
                {tier.claimed ? (
                  <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 text-xs font-semibold">
                    Claimed ✓
                  </span>
                ) : tier.unlocked ? (
                  <button
                    onClick={() => handleClaim(tier.id)}
                    disabled={claiming === tier.id}
                    className="px-4 py-1.5 rounded-lg bg-yellow-500 hover:bg-yellow-400 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    {claiming === tier.id ? "Claiming..." : "Claim"}
                  </button>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg bg-gray-200 text-gray-400 text-xs font-semibold">
                    {tier.remaining} more
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white rounded-2xl p-6 shadow border border-gray-200">
          <h2 className="text-lg font-bold text-gray-800 mb-1 text-center">How Your Friends Can Pay</h2>
          <p className="text-xs text-gray-400 mb-5 text-center">Premium is available through these payment methods</p>

          <div className="flex gap-3 justify-center">
            <div className="flex-1 flex flex-col items-center p-4 rounded-xl bg-green-50 border border-green-200">
              <img src="/logos/ecocash.png" alt="EcoCash" className="w-14 h-14 rounded-xl object-cover mb-2" />
              <p className="text-sm font-bold text-green-800">EcoCash</p>
              <p className="text-xs text-gray-500">Mobile Money</p>
            </div>
            <div className="flex-1 flex flex-col items-center p-4 rounded-xl bg-blue-50 border border-blue-200">
              <img src="/logos/innbucks.png" alt="InnBucks" className="w-14 h-14 rounded-xl object-cover mb-2" />
              <p className="text-sm font-bold text-blue-800">InnBucks</p>
              <p className="text-xs text-gray-500">Wallet</p>
            </div>
            <div className="flex-1 flex flex-col items-center p-4 rounded-xl bg-green-50 border border-green-200">
              <img src="/logos/omari.png" alt="O'mari" className="w-14 h-14 rounded-xl object-cover mb-2" />
              <p className="text-sm font-bold text-green-800">O'mari</p>
              <p className="text-xs text-gray-500">Mobile Money</p>
            </div>
          </div>

          <div className="mt-4 p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-center">
            <p className="text-xs text-blue-700 font-medium">Referrals only count when your friend upgrades to Premium</p>
          </div>
        </div>

        <div className="text-center pt-2">
          <Link href="/dashboard" className="text-brand-700 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}