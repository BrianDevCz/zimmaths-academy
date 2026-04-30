"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";

export default function SyllabusSwitcher() {
  const { token } = useAuth();
  const router = useRouter();
  const [active, setActive] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!token || !mounted) return;
    fetch(`${API_URL}/api/syllabus`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setActive(data.data.activeSyllabus);
      })
      .catch(() => {});
  }, [token, mounted]);

  const switchSyllabus = async (syllabus: string) => {
    if (loading || syllabus === active) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/syllabus/switch`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ activeSyllabus: syllabus }),
      });
      const data = await res.json();
      if (data.success) {
        setActive(data.data.activeSyllabus);
        router.refresh();
      }
    } catch {}
    setLoading(false);
  };

  if (!mounted || !token || !active) return null;

  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-[9px] text-brand-300 font-medium leading-none">Syllabus</span>
      <div className="flex items-center gap-0.5 bg-brand-700 rounded-md p-0.5">
        <button
          onClick={() => switchSyllabus("A")}
          disabled={loading}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
            active === "A"
              ? "bg-white text-brand-800"
              : "text-brand-200 hover:text-white"
          }`}
        >
          A
        </button>
        <button
          onClick={() => switchSyllabus("B")}
          disabled={loading}
          className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
            active === "B" || active === "BOTH"
              ? "bg-white text-brand-800"
              : "text-brand-200 hover:text-white"
          }`}
        >
          B
        </button>
      </div>
    </div>
  );
}