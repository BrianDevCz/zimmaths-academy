"use client";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";

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
  { id: "ecocash", label: "EcoCash", icon: "📱", colour: "bg-red-50 border-red-200 text-red-700" },
  { id: "innbucks", label: "Innbucks", icon: "💳", colour: "bg-blue-50 border-blue-200 text-blue-700" },
  { id: "omari", label: "Omari", icon: "💰", colour: "bg-green-50 border-green-200 text-green-700" },
];

interface PaymentInfo {
  success: boolean;
  paymentRef: string;
  plan: string;
  amount: number;
  paymentMethod: string;
  instructions: string;
}

export default function UpgradePage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [selectedMethod, setSelectedMethod] = useState("ecocash");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);

  const handleUpgrade = async () => {
    if (!token) {
      router.push("/login");
      return;
    }

    setError("");

if (!phone.trim()) {
  setError("Please enter your mobile number for payment verification.");
  return;
}

if (phone.trim().length < 9) {
  setError("Please enter a valid mobile number.");
  return;
}

setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/api/subscriptions/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          paymentMethod: selectedMethod,
          phone,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setPaymentInfo(data);
      } else {
        setError(data.error || "Failed to initiate payment.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Payment instructions screen
  if (paymentInfo) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-12 px-6 text-center">
          <div className="text-5xl mb-3">💳</div>
          <h1 className="text-3xl font-bold mb-2">Complete Your Payment</h1>
          <p className="text-brand-200">Follow the steps below to activate your premium access</p>
        </section>

        <div className="max-w-lg mx-auto px-6 py-10 space-y-6">

          {/* Payment Reference */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <p className="text-sm text-gray-500 mb-1">Your payment reference</p>
            <p className="text-2xl font-bold text-brand-800 font-mono tracking-wider">
              {paymentInfo.paymentRef}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Amount: <span className="font-bold text-gray-800">${paymentInfo.amount} USD</span>
              {" · "}
              Plan: <span className="font-bold text-gray-800">{paymentInfo.plan}</span>
            </p>
          </div>

          {/* Instructions */}
          <div className="bg-brand-50 border border-brand-200 rounded-2xl p-6">
            <h2 className="font-bold text-brand-800 mb-3">📋 Payment Instructions</h2>
            <p className="text-brand-700 leading-relaxed">{paymentInfo.instructions}</p>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6 space-y-4">
            <h2 className="font-bold text-gray-800">How to complete:</h2>
            {[
              "Send the exact amount using your chosen payment method",
              "Use your reference number: " + paymentInfo.paymentRef,
              "Send your payment screenshot to our WhatsApp",
              "We will activate your account within 30 minutes",
            ].map((step, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-brand-700 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-700 text-sm pt-0.5">{step}</p>
              </div>
            ))}
          </div>

          {/* WhatsApp CTA */}
          <a
            href={`https://wa.me/2637712345678?text=Hi!%20I%20have%20made%20payment%20for%20ZimMaths%20Premium.%20Reference:%20${paymentInfo.paymentRef}%20Plan:%20${paymentInfo.plan}%20Amount:%20$${paymentInfo.amount}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full bg-green-500 hover:bg-green-400 text-white py-4 rounded-xl font-bold text-lg text-center transition"
          >
            📲 Send Screenshot on WhatsApp
          </a>

          <button
            onClick={() => router.push("/")}
            className="block w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-semibold text-center transition"
          >
            Back to Home
          </button>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <div className="text-5xl mb-3">⭐</div>
        <h1 className="text-3xl font-bold mb-2">Unlock ZimMaths Premium</h1>
        <p className="text-brand-200 text-lg">
          Everything you need to pass ZIMSEC O-Level Maths
        </p>
        {user && (
          <p className="text-brand-300 text-sm mt-2">
            Upgrading as: {user.name}
          </p>
        )}
      </section>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Plan Selection */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Choose your plan
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <button
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={`relative text-left rounded-2xl border-2 p-6 transition ${
                  selectedPlan === plan.id
                    ? "border-brand-600 bg-brand-50"
                    : "border-gray-200 bg-white hover:border-brand-300"
                }`}
              >
                {plan.badge && (
                  <span className={`absolute -top-3 left-4 text-xs font-bold px-3 py-1 rounded-full ${
                    plan.badge === "BEST VALUE"
                      ? "bg-green-500 text-white"
                      : "bg-brand-600 text-white"
                  }`}>
                    {plan.badge}
                  </span>
                )}
                <p className="font-bold text-gray-800 text-lg">{plan.label}</p>
                <p className="text-3xl font-bold text-brand-700 mt-1">
                  ${plan.price}
                  <span className="text-sm font-normal text-gray-500 ml-1">
                    {plan.period}
                  </span>
                </p>
                <p className="text-sm text-gray-500 mt-2">{plan.description}</p>
                <ul className="mt-4 space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-green-500 mt-0.5">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        </div>

        {/* Payment Method */}
        <div>
          <h2 className="text-lg font-bold text-gray-800 mb-4">
            Choose payment method
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`border-2 rounded-xl p-4 text-center transition font-semibold ${
                  selectedMethod === method.id
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-gray-200 bg-white text-gray-700 hover:border-brand-300"
                }`}
              >
                <div className="text-3xl mb-2">{method.icon}</div>
                <p className="text-sm font-bold">{method.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Phone number (required) */}
        <div>
       <label className="block text-sm font-semibold text-gray-700 mb-2">
         Your mobile number <span className="text-red-500">*</span>
        </label>
        <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 0771234567"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        />
            <p className="text-xs text-gray-400 mt-1">
                Required for payment verification and account activation
            </p>
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
              <p className="font-bold text-gray-800">
                {plans.find((p) => p.id === selectedPlan)?.label} Plan
              </p>
              <p className="text-sm text-gray-500 capitalize">
                via {selectedMethod}
              </p>
            </div>
            <p className="text-3xl font-bold text-brand-700">
              ${plans.find((p) => p.id === selectedPlan)?.price}
            </p>
          </div>

          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-4 rounded-xl font-bold text-lg transition"
          >
            {loading ? "Processing..." : "Get Payment Instructions →"}
          </button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Your account will be activated within 30 minutes of payment confirmation
          </p>
        </div>

      </div>
    </main>
  );
}