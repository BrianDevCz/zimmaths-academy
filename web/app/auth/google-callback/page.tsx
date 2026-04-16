"use client";
import { useEffect, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

function GoogleCallbackInner() {
  const { data: session, status } = useSession();
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  useEffect(() => {
    if (status === "authenticated" && session?.apiToken && session?.apiUser) {
      login(session.apiToken, session.apiUser);
      router.push(redirectTo);
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, session]);

  return (
    <div className="min-h-screen bg-brand-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-brand-700 font-medium">Signing you in with Google...</p>
      </div>
    </div>
  );
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-brand-600">Loading...</div>
      </div>
    }>
      <GoogleCallbackInner />
    </Suspense>
  );
}
