"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user } = useAuth();

  const verified = searchParams.get("verified");

  useEffect(() => {
    if (user) {
      const redirectTo = searchParams.get("redirect") || "/";
      router.push(redirectTo);
    }
  }, [user]);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setError("");
    setNeedsVerification(false);

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await res.json();

      if (data.success) {
        login(data.token, data.user);
        const redirectTo = searchParams.get("redirect") || "/";
        router.push(redirectTo);
      } else if (data.needsVerification) {
        setNeedsVerification(true);
        setUnverifiedEmail(data.email || formData.email);
      } else {
        setError(data.error || "Login failed. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/resend-verification`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: unverifiedEmail }),
        }
      );
      const data = await res.json();
      if (data.success) setResendSent(true);
    } catch {
      // silent fail
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-brand-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md border border-gray-200">

          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-brand-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-2xl font-bold">Z</span>
            </div>
            <h1 className="text-3xl font-bold text-brand-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Log in to continue studying</p>
          </div>

          {verified && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-5 text-sm">
              ✅ Email verified! You can now log in.
            </div>
          )}

          {needsVerification && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg mb-5 text-sm">
              <p className="font-semibold mb-1">Please verify your email first.</p>
              <p className="text-yellow-700 mb-3">
                We sent a verification link to <strong>{unverifiedEmail}</strong>. Check your inbox and spam folder.
              </p>
              {resendSent ? (
                <p className="text-green-700 font-medium">Verification email resent!</p>
              ) : (
                <button
                  onClick={handleResendVerification}
                  disabled={resendLoading}
                  className="text-brand-700 hover:underline font-semibold disabled:opacity-50"
                >
                  {resendLoading ? "Sending..." : "Resend verification email"}
                </button>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="you@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end">
              <a
                href="/forgot-password"
                className="text-sm text-brand-700 hover:text-brand-600"
              >
                Forgot password?
              </a>
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-3 rounded-lg font-bold text-lg transition"
            >
              {loading ? "Logging in..." : "Log In"}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-brand-700 font-semibold hover:text-brand-600">
              Register free
            </a>
          </p>

        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-brand-600">Loading...</div>
      </div>
    }>
      <LoginPageInner />
    </Suspense>
  );
}
