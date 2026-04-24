"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Image from "next/image";

const plans = [
  {
    id: "two_weeks",
    label: "2 Weeks",
    price: 3,
    period: "once-off",
    description: "Perfect for exam revision crunch",
    badge: null,
    features: [
      "All 50+ past papers with solutions",
      "Unlimited AI Tutor (Takudzwa)",
      "All 15 topic lessons",
      "Unlimited practice tests",
      "Performance dashboard",
      "Exam predictions",
    ],
  },
  {
    id: "monthly",
    label: "1 Month",
    price: 5,
    period: "per month",
    description: "Structured monthly preparation",
    badge: "POPULAR",
    features: [
      "Everything in 2 Weeks",
      "Full progress tracking",
      "Downloadable summary notes",
      "Priority AI responses",
    ],
  },
  {
    id: "annual",
    label: "1 Year",
    price: 45,
    period: "per year",
    description: "Best value — full year access",
    badge: "BEST VALUE",
    features: [
      "Everything in Monthly",
      "Form 3 & Form 4 content",
      "Early access to new features",
      "Save $15 vs monthly",
    ],
  },
];

const paymentMethods = [
  {
    id: "ecocash",
    label: "EcoCash",
    logo: "/logos/ecocash.png",
    fallbackColor: "#E63946",
    fallbackText: "EC",
  },
  {
    id: "innbucks",
    label: "Innbucks",
    logo: "/logos/innbucks.png",
    fallbackColor: "#2196F3",
    fallbackText: "IB",
  },
  {
    id: "omari",
    label: "Omari",
    logo: "/logos/omari.png",
    fallbackColor: "#4CAF50",
    fallbackText: "OM",
  },
];

const MAX_POLL_ATTEMPTS = 24;

interface PaymentInfo {
  paymentRef: string;
  plan: string;
  amount: number;
  paymentMethod: string;
  instructions: string;
  pollUrl?: string;
  redirectUrl?: string;
}

// Payment logo component with fallback
function PaymentLogo({ method, size = "lg" }: { method: typeof paymentMethods[0]; size?: "sm" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const h = size === "lg" ? 40 : 28;
  const w = size === "lg" ? 80 : 56;

  if (imgError) {
    return (
      <div
        className={`flex items-center justify-center rounded-lg font-bold text-white ${size === "lg" ? "w-20 h-10 text-sm" : "w-14 h-7 text-xs"}`}
        style={{ backgroundColor: method.fallbackColor }}
      >
        {method.fallbackText}
      </div>
    );
  }

  return (
    <Image
      src={method.logo}
      alt={method.label}
      width={w}
      height={h}
      className="object-contain"
      onError={() => setImgError(true)}
    />
  );
}

export default function UpgradePage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedMethod, setSelectedMethod] = useState("ecocash");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [pollStatus, setPollStatus] = useState<"waiting" | "paid" | "timeout">("waiting");
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    if (!paymentInfo || pollStatus === "paid") return;
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(async () => {
      setPollCount((prev) => {
        if (prev >= MAX_POLL_ATTEMPTS) {
          clearInterval(intervalRef.current);
          setPollStatus("timeout");
          return prev;
        }
        return prev + 1;
      });

      try {
        let paid = false;
        if (paymentInfo.pollUrl) {
          const res = await fetch(
            `${API_URL}/api/subscriptions/poll-paynow?pollUrl=${encodeURIComponent(paymentInfo.pollUrl)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (data.paid) paid = true;
        } else {
          const res = await fetch(
            `${API_URL}/api/subscriptions/status/${paymentInfo.paymentRef}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data = await res.json();
          if (data.isPremium) paid = true;
        }
        if (paid) { clearInterval(intervalRef.current); setPollStatus("paid"); }
      } catch (err) {
        console.error("Poll error:", err);
      }
    }, 5000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [paymentInfo, token, pollStatus]);

  const handleUpgrade = async () => {
    if (!token) { router.push("/login"); return; }
    setError("");

    if (!phone.trim()) { setError("Please enter your mobile number."); return; }
    const phoneRegex = /^(07[7-8][0-9]{7}|07[1-2][0-9]{7})$/;
    if (!phoneRegex.test(phone.trim())) { setError("Please enter a valid Zimbabwe mobile number (e.g., 0771234567)"); return; }
    if (!email.trim()) { setError("Please enter your email address."); return; }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) { setError("Please enter a valid email address."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/subscriptions/initiate-paynow`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan: selectedPlan, paymentMethod: selectedMethod, phone: phone.trim(), email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setPaymentInfo({
          paymentRef: data.paymentRef, plan: data.plan, amount: data.amount,
          paymentMethod: selectedMethod, instructions: data.instructions,
          pollUrl: data.pollUrl || null, redirectUrl: data.redirectUrl || null,
        });
        setPollCount(0);
        setPollStatus("waiting");
        if (selectedMethod === "omari" && data.redirectUrl) window.location.href = data.redirectUrl;
      } else {
        setError(data.error || "Failed to initiate payment.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (pollStatus === "paid") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Confirmed!</h1>
          <p className="text-gray-500 mb-2">Welcome to ZimMaths Premium!</p>
          <p className="text-sm text-gray-400 mb-2">Your {plans.find((p) => p.id === selectedPlan)?.label} plan is now active.</p>
          <p className="text-xs text-gray-300 mb-8">Reference: {paymentInfo?.paymentRef}</p>
          <a href="/dashboard" className="block w-full bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-xl font-bold transition text-center">
            Go to Dashboard
          </a>
        </div>
      </main>
    );
  }

  // Timeout screen
  if (pollStatus === "timeout") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-10 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⏰</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Payment Still Pending</h1>
          <p className="text-gray-500 mb-4">We haven't received confirmation yet.</p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-yellow-800 font-semibold mb-2">What to do:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Check if you completed the payment on your phone</li>
              <li>• Make sure you have sufficient balance</li>
              <li>• Try the payment again</li>
            </ul>
          </div>
          <div className="space-y-3">
            <button onClick={() => { setPaymentInfo(null); setPollStatus("waiting"); setPollCount(0); }}
              className="w-full bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-xl font-bold transition">
              Try Again
            </button>
            <button onClick={() => router.push("/")}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition">
              Back to Home
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Pending screen
  if (paymentInfo) {
    const method = paymentMethods.find((m) => m.id === paymentInfo.paymentMethod);
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-12 px-6 text-center">
          <div className="text-5xl mb-3">📱</div>
          <h1 className="text-3xl font-bold mb-2">Check Your Phone</h1>
          <p className="text-brand-200">A payment request has been sent to {phone}</p>
        </section>

        <div className="max-w-lg mx-auto px-6 py-10 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Payment reference</p>
            <p className="text-xl font-bold text-brand-800 font-mono break-all">{paymentInfo.paymentRef}</p>
            <div className="flex items-center gap-3 mt-3">
              <p className="text-sm text-gray-500">
                <span className="font-bold text-gray-800">${paymentInfo.amount} USD</span> · {paymentInfo.plan}
              </p>
              {method && (
                <div className="ml-auto">
                  <PaymentLogo method={method} size="sm" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6">
            <h2 className="font-bold text-brand-800 mb-3">📋 Instructions</h2>
            <p className="text-brand-700 leading-relaxed">{paymentInfo.instructions}</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="font-semibold text-gray-700 mb-1">Waiting for payment confirmation...</p>
            <p className="text-sm text-gray-400">This page will update automatically once payment is received.</p>
            <p className="text-xs text-gray-300 mt-2">Checking... ({pollCount} / {MAX_POLL_ATTEMPTS})</p>
          </div>

          <button onClick={() => { if (intervalRef.current) clearInterval(intervalRef.current); setPaymentInfo(null); setPollStatus("waiting"); }}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold transition">
            Back to Plans
          </button>
        </div>
      </main>
    );
  }

  // Main upgrade screen
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-3xl font-bold mb-2">Unlock ZimMaths Premium</h1>
        <p className="text-brand-200 text-lg">Everything you need to pass ZIMSEC O-Level Maths</p>
        {user && <p className="text-brand-300 text-sm mt-2">Upgrading as: {user.name}</p>}
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Plan Selection */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Choose your plan</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <button key={plan.id} onClick={() => setSelectedPlan(plan.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition ${
                  selectedPlan === plan.id ? "border-brand-600 bg-brand-50" : "border-gray-200 bg-white hover:border-brand-300"
                }`}>
                {plan.badge && (
                  <span className={`absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full ${
                    plan.badge === "BEST VALUE" ? "bg-green-500 text-white" : "bg-brand-600 text-white"
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <p className="font-bold text-gray-800 text-lg">{plan.label}</p>
                <p className="text-3xl font-bold text-brand-700 mt-1">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500 ml-1">{plan.period}</span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span>{f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Choose payment method</h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button key={method.id} onClick={() => setSelectedMethod(method.id)}
                className={`border-2 rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition min-h-[100px] ${
                  selectedMethod === method.id
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-brand-300"
                }`}>
                <PaymentLogo method={method} size="lg" />
                <p className={`text-sm font-bold ${selectedMethod === method.id ? "text-brand-700" : "text-gray-700"}`}>
                  {method.label}
                </p>
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            Payments processed securely by Paynow Zimbabwe 🔒
          </p>
        </div>

        {/* Contact Details */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Your mobile number <span className="text-red-500">*</span>
            </label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 0771234567"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <p className="text-xs text-gray-400 mt-1">A payment request will be sent to this number</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email address <span className="text-red-500">*</span>
            </label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            <p className="text-xs text-gray-400 mt-1">For payment receipt and account activation</p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Summary & CTA */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <p className="font-bold text-gray-800">{plans.find((p) => p.id === selectedPlan)?.label} Plan</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-gray-500">via</span>
                <PaymentLogo method={paymentMethods.find((m) => m.id === selectedMethod)!} size="sm" />
              </div>
            </div>
            <p className="text-3xl font-bold text-brand-700">${plans.find((p) => p.id === selectedPlan)?.price}</p>
          </div>

          <button onClick={handleUpgrade} disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-4 rounded-xl font-bold text-lg transition">
            {loading ? "Sending payment request..." : "Pay Now →"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Payments processed securely by Paynow Zimbabwe
          </p>
        </div>

      </div>
    </main>
  );
}
