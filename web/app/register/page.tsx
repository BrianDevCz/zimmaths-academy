"use client";
import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { API_URL } from "@/app/lib/api";

function RegisterForm() {
  const searchParams = useSearchParams();
  const urlRefCode = searchParams.get("ref") || "";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    grade: "",
    password: "",
    confirmPassword: "",
    referralCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [registered, setRegistered] = useState(false);
  const [referrerName, setReferrerName] = useState("");
  const [validatingCode, setValidatingCode] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [selectedSyllabus, setSelectedSyllabus] = useState<string[]>([]);

  // Auto-fill referral code from URL
  useEffect(() => {
    if (urlRefCode) {
      setFormData((prev) => ({ ...prev, referralCode: urlRefCode }));
      validateReferralCode(urlRefCode);
    }
  }, [urlRefCode]);

  const validateReferralCode = async (code: string) => {
    if (!code || code.trim().length < 4) {
      setReferrerName("");
      setCodeError("");
      return;
    }

    setValidatingCode(true);
    setCodeError("");

    try {
      const res = await fetch(`${API_URL}/api/referrals/validate/${code.trim()}`);
      const data = await res.json();
      if (data.success) {
        setReferrerName(data.data.referrerName);
        setCodeError("");
      } else {
        setReferrerName("");
        setCodeError("Invalid referral code. Check and try again.");
      }
    } catch {
      setReferrerName("");
    } finally {
      setValidatingCode(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    if (name === "referralCode") {
      setCodeTouched(true);
      const trimmed = value.trim();
      if (trimmed.length >= 4) {
        const timer = setTimeout(() => validateReferralCode(trimmed), 500);
        return () => clearTimeout(timer);
      } else {
        setReferrerName("");
        setCodeError("");
      }
    }
  };

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true);
    const syllabusParam = selectedSyllabus.length > 0 ? selectedSyllabus.join(",") : "B";
    const finalRefCode = formData.referralCode || urlRefCode;
    let callbackUrl = `/auth/google-callback?redirect=/dashboard&syllabus=${syllabusParam}`;
    if (finalRefCode) callbackUrl += `&ref=${finalRefCode}`;
    await signIn("google", { callbackUrl });
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

    if (selectedSyllabus.length === 0) {
      setError("Please select at least one syllabus.");
      return;
    }

    if (codeError && formData.referralCode.trim()) {
      setError("Please fix the referral code or remove it before continuing.");
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
          referralCode: formData.referralCode.trim() || undefined,
          syllabusChoice: selectedSyllabus.length > 0 ? selectedSyllabus : ["B"],
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

          {/* Referral Banner */}
          {referrerName && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-5 text-sm text-center animate-fade-in">
              🎁 <strong>{referrerName}</strong> invited you to ZimMaths! They'll earn rewards when you upgrade.
            </div>
          )}

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
              {error}
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

            {/* Syllabus Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Which syllabus are you studying?
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSyllabus((prev) =>
                      prev.includes("A") ? prev.filter((s) => s !== "A") : [...prev, "A"]
                    )
                  }
                  className={`border-2 rounded-xl px-4 py-3 text-center font-semibold text-sm transition ${
                    selectedSyllabus.includes("A")
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Syllabus A
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">Functional</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSyllabus((prev) =>
                      prev.includes("B") ? prev.filter((s) => s !== "B") : [...prev, "B"]
                    )
                  }
                  className={`border-2 rounded-xl px-4 py-3 text-center font-semibold text-sm transition ${
                    selectedSyllabus.includes("B")
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Syllabus B
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">Professional</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSyllabus(prev =>
                      prev.includes("A") && prev.includes("B") ? prev.filter(s => s !== "A" && s !== "B") : ["A", "B"]
                    )
                  }
                  className={`border-2 rounded-xl px-4 py-3 text-center font-semibold text-sm transition ${
                    selectedSyllabus.includes("A") && selectedSyllabus.includes("B")
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  Both
                  <span className="block text-xs font-normal text-gray-400 mt-0.5">All content</span>
                </button>
              </div>
              {selectedSyllabus.length === 0 && (
                <p className="text-amber-600 text-xs mt-1.5">Select at least one syllabus to continue.</p>
              )}
            </div>

            {/* Referral Code Field */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Referral Code <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="referralCode"
                  value={formData.referralCode}
                  onChange={handleChange}
                  placeholder="Enter a friend's referral code"
                  className={`w-full border rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-1 transition ${
                    referrerName
                      ? "border-green-400 focus:border-green-500 focus:ring-green-500 bg-green-50"
                      : codeError && codeTouched
                      ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:border-brand-500 focus:ring-brand-500"
                  }`}
                />
                {validatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {referrerName && !validatingCode && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-lg">✓</div>
                )}
              </div>
              {referrerName && !validatingCode && (
                <p className="text-green-600 text-xs mt-1.5">✅ Referral by <strong>{referrerName}</strong></p>
              )}
              {codeError && codeTouched && (
                <p className="text-red-500 text-xs mt-1.5">{codeError}</p>
              )}
              {!referrerName && !codeError && formData.referralCode.trim() && codeTouched && !validatingCode && (
                <p className="text-gray-400 text-xs mt-1.5">Leave blank if you don't have a referral code</p>
              )}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </main>
    }>
      <RegisterForm />
    </Suspense>
  );
}