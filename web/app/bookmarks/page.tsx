"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";
import MathContent from "../components/MathContent";
import Link from "next/link";

export default function BookmarksPage() {
  const { token, loading: authLoading } = useAuth();
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !token) return;
    fetchBookmarks();
  }, [token, authLoading]);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${API_URL}/api/bookmarks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setBookmarks(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (questionId: string) => {
    try {
      await fetch(`${API_URL}/api/bookmarks/${questionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookmarks((prev) => prev.filter((b) => b.questionId !== questionId));
    } catch (err) {
      console.error(err);
    }
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading bookmarks...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-1">📌 My Bookmarks</h1>
          <p className="text-brand-200">Questions you've saved for later</p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-10">
        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center border border-gray-200">
            <div className="text-5xl mb-4">📌</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No bookmarks yet</h2>
            <p className="text-gray-500 mb-6">
              Bookmark questions while practising to review them later.
            </p>
            <Link
              href="/papers"
              className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
            >
              Browse Papers
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-500 text-sm mb-4">{bookmarks.length} bookmarked question{bookmarks.length !== 1 ? 's' : ''}</p>
            {bookmarks.map((bookmark) => {
              const q = bookmark.question;
              return (
                <div key={bookmark.id} className="bg-white rounded-2xl shadow p-6 border border-gray-200">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-brand-800 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0">
                        Q{q.questionNumber}
                      </span>
                      <div>
                        <p className="text-xs text-gray-400">
                          {q.paper?.title || 'Practice'} · {q.topic?.icon} {q.topic?.name}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className={
                            "text-xs px-2 py-0.5 rounded capitalize " +
                            (q.difficulty === "easy" ? "bg-green-100 text-green-700" :
                              q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                                "bg-yellow-100 text-yellow-700")
                          }>
                            {q.difficulty}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            {q.marks} marks
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBookmark(q.id)}
                      className="text-gray-400 hover:text-red-500 transition text-sm font-medium"
                      title="Remove bookmark"
                    >
                      ✕ Remove
                    </button>
                  </div>

                  {/* Question text */}
                  <div className="text-gray-800 text-sm mb-4 leading-relaxed">
                    <MathContent>{(q.questionText?.slice(0, 200) || "") + (q.questionText?.length > 200 ? "..." : "")}</MathContent>
                  </div>

                  {/* Note */}
                  {bookmark.note && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 mb-4 text-sm text-yellow-800">
                      📝 {bookmark.note}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    {q.paperId ? (
                      <Link
                        href={`/papers/${q.paperId}/questions/${q.id}`}
                        className="bg-brand-700 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                      >
                        View Solution
                      </Link>
                    ) : null}
                    <Link
                      href={`/topics/${q.topic?.slug}`}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      {q.topic?.icon} Study Topic
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
