"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";

interface BookmarkButtonProps {
  questionId: string;
  className?: string;
}

export default function BookmarkButton({ questionId, className = "" }: BookmarkButtonProps) {
  const { token } = useAuth();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    checkBookmark();
  }, [token, questionId]);

  const checkBookmark = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookmarks/check/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setIsBookmarked(data.isBookmarked);
    } catch {}
  };

  const toggleBookmark = async () => {
    if (!token || loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        await fetch(`${API_URL}/api/bookmarks/${questionId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setIsBookmarked(false);
      } else {
        await fetch(`${API_URL}/api/bookmarks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ questionId }),
        });
        setIsBookmarked(true);
      }
    } catch {} finally {
      setLoading(false);
    }
  };

  if (!token) return null;

  return (
    <button
      onClick={toggleBookmark}
      disabled={loading}
      title={isBookmarked ? "Remove bookmark" : "Bookmark this question"}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition disabled:opacity-50 ${
        isBookmarked
          ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border border-yellow-300"
          : "bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200"
      } ${className}`}
    >
      {isBookmarked ? "📌 Bookmarked" : "📌 Bookmark"}
    </button>
  );
}
