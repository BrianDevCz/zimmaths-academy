"use client";
import { useEffect, useState } from "react";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";

export default function SharePageClient({ questionId }: { questionId: string }) {
  const [question, setQuestion] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!questionId) return;
    fetch(`${API_URL}/api/questions/${questionId}`)
      .then((r) => r.json())
      .then((data) => { if (data.success) setQuestion(data.data); })
      .finally(() => setLoading(false));
  }, [questionId]);

  const shareImageUrl = `${API_URL}/api/share/${questionId}`;
  const siteUrl = `https://zimmaths.com`;
  const questionUrl = question?.paperId
    ? `${siteUrl}/papers/${question.paperId}/questions/${questionId}`
    : siteUrl;

  const whatsappMessage = `🧮 Can you solve this ${question?.topic?.name || "Maths"} question?\n\n🔗 See the solution at:\n${questionUrl}\n\n📚 Practice more at zimmaths.com — Zimbabwe's #1 O-Level Maths platform!`;

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(questionUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  if (!question) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Question not found</p>
          <Link href="/" className="text-brand-700 hover:underline">Back to Home</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-800 text-white py-10 px-6 text-center">
        <h1 className="text-2xl font-bold mb-1">Share This Question</h1>
        <p className="text-brand-200">Challenge your friends with this question</p>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Preview Card */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          <p className="text-sm font-semibold text-gray-500 px-6 pt-4 pb-2">Preview — this is what people will see:</p>
          <img
            src={shareImageUrl}
            alt="Question share card"
            className="w-full"
            style={{ aspectRatio: "1200/630" }}
          />
        </div>

        {/* Share Actions */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 space-y-4">
          <h2 className="text-lg font-bold text-gray-800">Share via</h2>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-green-500 hover:bg-green-400 text-white px-6 py-4 rounded-xl font-bold transition w-full"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Share on WhatsApp
          </a>

          {/* Download Image */}
          <a
            href={shareImageUrl}
            download={`zimmaths-question-${questionId}.png`}
            className="flex items-center gap-3 bg-brand-700 hover:bg-brand-600 text-white px-6 py-4 rounded-xl font-bold transition w-full"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            Download Image
          </a>

          {/* Copy Link */}
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-4 rounded-xl font-bold transition w-full"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
            </svg>
            {copied ? "✅ Link Copied!" : "Copy Question Link"}
          </button>
        </div>

        {/* Back link l*/}
        <div className="text-center">
          {question.paperId ? (
            <Link href={`/papers/${question.paperId}/questions/${questionId}`}
              className="text-brand-700 hover:underline text-sm">
              ← Back to Question
            </Link>
          ) : (
            <Link href="/papers" className="text-brand-700 hover:underline text-sm">
              ← Back to Papers
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
