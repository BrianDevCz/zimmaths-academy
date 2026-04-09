"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found.");
      return;
    }

    fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/auth/verify-email?token=${token}`
    )
      .then((r) => {
        if (r.ok || r.redirected) {
          setStatus("success");
          setMessage("Your email has been verified successfully!");
        } else {
          return r.json().then((d) => {
            setStatus("error");
            setMessage(d.error || "Verification failed.");
          });
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Could not connect to server.");
      });
  }, [token]);

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-2xl shadow p-10 border border-gray-200 max-w-md w-full text-center">

        {status === "loading" && (
          <div>
            <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        )}

        {status === "success" && (
          <div>
            <div className="text-6xl mb-4">✅</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Verified!</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <a
              href="/login"
              className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block"
            >
              Sign In Now
            </a>
          </div>
        )}

        {status === "error" && (
          <div>
            <div className="text-6xl mb-4">❌</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Verification Failed</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <div className="space-y-3">
              <a
                href="/login"
                className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block w-full"
              >
                Go to Login
              </a>
              <a href="/register" className="text-brand-600 hover:underline text-sm block">
                Create a new account
              </a>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
