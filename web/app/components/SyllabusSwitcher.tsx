"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";

export default function SyllabusSwitcher() {
  const { token } = useAuth();
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
        window.location.reload();
      }
    } catch {}
    setLoading(false);
  };

  if (!mounted || !token || !active) return null;

  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 p-1">
      <button
        onClick={() => switchSyllabus("A")}
        disabled={loading}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
          active === "A"
            ? "bg-brand-600 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        Syllabus A
      </button>
      <button
        onClick={() => switchSyllabus("B")}
        disabled={loading}
        className={`px-3 py-1.5 rounded-md text-xs font-semibold transition ${
          active === "B" || active === "BOTH"
            ? "bg-brand-600 text-white"
            : "text-gray-500 hover:bg-gray-100"
        }`}
      >
        Syllabus B
      </button>
    </div>
  );
}