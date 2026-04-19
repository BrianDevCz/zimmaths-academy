"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { API_URL } from "@/app/lib/api";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/auth/google-callback?redirect=/dashboard" });
  };

  const handleSubmit = async () => {
    setError("");

    if (!formData.name || !formData.email || !formData.password) {
      setError("Please fill in all required fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          grade: formData.grade,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setRegistered(true);
      } else {
        setError(data.error || data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setError("Cannot connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
    return (
      <main className="min-h-screen bg-brand-50 flex flex-col">
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md border border-gray-200 text-center">
            <div className="text-6xl mb-4">📧</div>
            <h1 className="text-2xl font-bold text-brand-800 mb-3">Check your email!</h1>
            <p className="text-gray-600 mb-2">We sent a verification link to:</p>
            <p className="text-brand-700 font-semibold mb-6">{formData.email}</p>
            <p className="text-gray-500 text-sm mb-8">
              Click the link in the email to activate your account. Check your spam folder if you don't see it.
            </p>
            <a href="/login" className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block">
              Go to Sign In
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-brand-50 flex flex-col">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md border border-gray-200">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-800 mb-2">Create Your Account</h1>
            <p className="text-gray-500">Join thousands of Zimbabwe students passing maths</p>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignUp}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-lg px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 transition mb-5 disabled:opacity-50"
          >
            <svg width="20" height="20" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
            </svg>
            {googleLoading ? "Signing up..." : "Sign up with Google"}
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="text-gray-400 text-sm">or register with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-5 text-sm">
              ⚠️ {error}
            </div>
          )}

          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange}
                placeholder="Your full name"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input type="email" name="email" value={formData.email} onChange={handleChange}
                placeholder="you@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Grade</label>
              <select name="grade" value={formData.grade} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                <option value="">Select your grade</option>
                <option value="form3">Form 3</option>
                <option value="form4">Form 4</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange}
                placeholder="Create a password (min 6 characters)"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm Password</label>
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="Repeat your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
            </div>

            <button onClick={handleSubmit} disabled={loading}
              className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-3 rounded-lg font-bold text-lg transition">
              {loading ? "Creating Account..." : "Create Free Account"}
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Already have an account?{" "}
            <a href="/login" className="text-brand-700 font-semibold hover:text-brand-600">Log in here</a>
          </p>

        </div>
      </div>
    </main>
  );
}
