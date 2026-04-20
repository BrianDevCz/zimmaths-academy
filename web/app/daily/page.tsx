"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import MathContent from "../components/MathContent";
import MathKeyboard from "../components/MathKeyboard";

// Detect parts like (a), (b), (c) in question text
function detectParts(questionText: string): string[] {
  const matches = questionText.match(/\(([a-e])\)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[()]/g, "")))];
}

export default function DailyChallengePage() {
  const { token } = useAuth();
  const [challenge, setChallenge] = useState<any>(null);
  const [yesterday, setYesterday] = useState<any>(null);
  const [answer, setAnswer] = useState("");
  const [partAnswers, setPartAnswers] = useState<{ [part: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitResult, setSubmitResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrTarget, setOcrTarget] = useState<string | null>(null); // 'single' or part letter
  const [error, setError] = useState("");
  const [timeLeft, setTimeLeft] = useState("");
  const [ocrPreviews, setOcrPreviews] = useState<{ [key: string]: string }>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTargetRef = useRef<string | null>(null);

  const questionText = challenge?.question?.questionText || "";
  const parts = detectParts(questionText);
  const isMultiPart = parts.length > 1;

  useEffect(() => {
    fetchChallenge();
    fetchYesterday();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(hours + "h " + minutes + "m " + seconds + "s");
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { return () => { stopCamera(); }; }, []);

  const fetchChallenge = async () => {
    try {
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${API_URL}/api/daily/today`, { headers });
      const data = await res.json();
      if (data.success) {
        setChallenge(data.data);
        if (data.data.userAttempt) {
          setSubmitted(true);
          setSubmitResult(data.data.userAttempt);
          setAnswer(data.data.userAttempt.userAnswer || "");
        }
      }
    } catch {
      setError("Failed to load today's challenge");
    } finally {
      setLoading(false);
    }
  };

  const fetchYesterday = async () => {
    try {
      const res = await fetch(`${API_URL}/api/daily/yesterday`);
      const data = await res.json();
      if (data.success) setYesterday(data.data);
    } catch {}
  };

  // ── Camera ──────────────────────────────────────────────────
  const startCamera = async (target: string) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCameraStream(stream);
      setCameraTarget(target);
      setShowCamera(true);
      setTimeout(() => { if (videoRef.current) videoRef.current.srcObject = stream; }, 100);
    } catch {
      alert("Could not access camera. Please use image upload instead.");
    }
  };

  const stopCamera = () => {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setShowCamera(false);
    setCameraTarget(null);
  };

  const capturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current || !cameraTarget) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    const base64 = canvas.toDataURL("image/jpeg", 0.85);
    const target = cameraTarget;
    stopCamera();
    await processImage(base64, target);
  };

  const openFileUpload = (target: string) => {
    fileTargetRef.current = target;
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileTargetRef.current) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await processImage(ev.target?.result as string, fileTargetRef.current!);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const processImage = async (base64: string, target: string) => {
    setOcrLoading(true);
    setOcrTarget(target);
    setOcrPreviews((prev) => ({ ...prev, [target]: base64 }));
    try {
      const res = await fetch(`${API_URL}/api/practice/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ imageBase64: base64 }),
      });
      const data = await res.json();
      if (data.success && data.text) {
        if (target === 'single') {
          setAnswer(data.text);
        } else {
          setPartAnswers((prev) => ({ ...prev, [target]: data.text }));
        }
      } else {
        alert("Could not read handwriting. Please type your answer.");
      }
    } catch {
      alert("Image processing failed. Please type your answer.");
    } finally {
      setOcrLoading(false);
      setOcrTarget(null);
    }
  };

  const clearPreview = (target: string) => {
    setOcrPreviews((prev) => { const n = { ...prev }; delete n[target]; return n; });
    if (target === 'single') setAnswer("");
    else setPartAnswers((prev) => { const n = { ...prev }; delete n[target]; return n; });
  };

  const handleSubmit = async () => {
    const hasAnswer = isMultiPart
      ? Object.values(partAnswers).some((v) => v.trim().length > 0)
      : answer.trim().length > 0;

    if (!hasAnswer) { setError("Please enter your answer"); return; }
    if (!challenge) return;

    setSubmitting(true);
    setError("");

    // Build final answer string
    const finalAnswer = isMultiPart
      ? Object.entries(partAnswers).map(([k, v]) => `(${k}) ${v}`).join(" ")
      : answer;

    try {
      const headers: any = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/api/daily/attempt`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          challengeId: challenge.id,
          userAnswer: finalAnswer,
          partAnswers: isMultiPart ? partAnswers : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
        setSubmitResult(data.data);
      } else {
        setError(data.message || "Failed to submit");
      }
    } catch {
      setError("Cannot connect to server");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Answer input block (reusable) ───────────────────────────
  const renderAnswerInput = (target: string, label: string) => (
    <div className="space-y-2">
      {ocrPreviews[target] && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">📷 Captured:</p>
          <img src={ocrPreviews[target]} alt="Captured" className="max-h-24 rounded object-contain" />
          {ocrLoading && ocrTarget === target && (
            <p className="text-xs text-brand-600 mt-1 animate-pulse">Reading your handwriting...</p>
          )}
        </div>
      )}
      <MathKeyboard
        value={target === 'single' ? answer : (partAnswers[target] || "")}
        onChange={(v) => target === 'single' ? setAnswer(v) : setPartAnswers((prev) => ({ ...prev, [target]: v }))}
        placeholder={label}
      />
      <div className="flex gap-2">
        <button onClick={() => startCamera(target)} disabled={ocrLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-medium transition">
          📷 Camera
        </button>
        <button onClick={() => openFileUpload(target)} disabled={ocrLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-medium transition">
          🖼️ Upload
        </button>
        {ocrPreviews[target] && (
          <button onClick={() => clearPreview(target)}
            className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs transition">
            Clear
          </button>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">🧮</div>
          <p className="text-gray-500 text-lg">Loading today's challenge...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
          <p className="text-white text-sm mb-3">Point camera at your handwritten working</p>
          <video ref={videoRef} autoPlay playsInline className="w-full max-w-sm rounded-xl border-2 border-white" />
          <div className="flex gap-4 mt-4">
            <button onClick={capturePhoto} className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold">📸 Capture</button>
            <button onClick={stopCamera} className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold">Cancel</button>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <div className="text-5xl mb-4">🏆</div>
        <h1 className="text-4xl font-bold mb-2">Daily Challenge</h1>
        <p className="text-brand-200 text-lg">A new maths question every day</p>
        <div className="mt-4 inline-block bg-brand-700 px-6 py-2 rounded-full">
          <span className="text-brand-200 text-sm">New challenge in: </span>
          <span className="text-white font-bold">{timeLeft}</span>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-6 py-10 space-y-6">

        {challenge ? (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">Today's Challenge</h2>
              <span className="text-sm text-gray-400">
                {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              </span>
            </div>

            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">
                {challenge.question?.topic?.name}
              </span>
              <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full capitalize">
                {challenge.question?.difficulty}
              </span>
              <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                {challenge.question?.marks} marks
              </span>
            </div>

            <div className="text-gray-800 text-xl leading-relaxed mb-6">
              <MathContent>{questionText}</MathContent>
            </div>

            {submitted ? (
              <div className="space-y-4">
                <div className={`border rounded-xl p-4 text-center ${
                  submitResult?.isCorrect ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
                }`}>
                  <div className="text-3xl mb-2">{submitResult?.isCorrect ? "🎉" : "✅"}</div>
                  <p className={`font-semibold text-lg ${submitResult?.isCorrect ? "text-green-700" : "text-blue-700"}`}>
                    {submitResult?.isCorrect ? "Correct! Well done!" : "Answer submitted!"}
                  </p>
                  <p className="text-sm mt-1 text-gray-600">
                    Your answer: <strong>{submitResult?.userAnswer || answer}</strong>
                  </p>
                  {submitResult?.pointsAwarded > 0 && (
                    <p className="text-brand-600 font-semibold mt-1">+{submitResult.pointsAwarded} points earned!</p>
                  )}
                  {!submitResult?.isCorrect && (
                    <p className="text-gray-500 text-sm mt-1">Come back tomorrow to see the solution!</p>
                  )}
                  {submitResult?.badgesAwarded?.length > 0 && (
                    <p className="text-yellow-600 font-semibold mt-2">
                      🏅 New badge: {submitResult.badgesAwarded.join(', ')}
                    </p>
                  )}
                </div>
                <a href={
                    "https://wa.me/?text=I just attempted today's ZimMaths Daily Challenge! Can you solve it? " +
                    encodeURIComponent(questionText) + " Try it at zimmaths.com/daily"
                  }
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center bg-green-500 hover:bg-green-400 text-white py-3 rounded-lg font-semibold transition">
                  Share on WhatsApp
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
                )}

                {isMultiPart ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500 font-medium">Answer each part separately:</p>
                    {parts.map((part) => (
                      <div key={part} className="border border-gray-200 rounded-xl p-4">
                        <label className="block text-sm font-bold text-brand-700 mb-2">Part ({part})</label>
                        {renderAnswerInput(part, `Answer for part (${part})...`)}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Your Answer</label>
                    {renderAnswerInput('single', 'Type your answer or use camera/upload...')}
                  </div>
                )}

                <p className="text-xs text-gray-400">
                  📸 You can photograph your handwritten working — our AI will read and mark it
                </p>

                <button onClick={handleSubmit} disabled={submitting || ocrLoading}
                  className="w-full bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white py-3 rounded-lg font-bold text-lg transition">
                  {submitting ? "Submitting..." : "Submit Answer"}
                </button>

                <a href={
                    "https://wa.me/?text=Can you solve today's ZimMaths Daily Challenge? " +
                    encodeURIComponent(questionText) + " Try it at zimmaths.com/daily"
                  }
                  target="_blank" rel="noopener noreferrer"
                  className="block text-center border border-green-500 text-green-600 hover:bg-green-50 py-3 rounded-lg font-semibold transition">
                  Share Challenge on WhatsApp
                </a>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-center gap-8 text-center">
              <div>
                <p className="text-2xl font-bold text-brand-800">{challenge.totalAttempts || 0}</p>
                <p className="text-xs text-gray-400">Students attempted</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-brand-800">{challenge.correctAttempts || 0}</p>
                <p className="text-xs text-gray-400">Got it correct</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-10 text-center border border-gray-200">
            <div className="text-4xl mb-4">🔧</div>
            <p className="text-gray-500 text-lg">No challenge available today. Check back soon!</p>
          </div>
        )}

        {yesterday && (
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Yesterday's Challenge — Solution</h2>
            <p className="text-gray-400 text-sm mb-4">
              {new Date(Date.now() - 86400000).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long",
              })}
            </p>
            <div className="text-gray-800 text-lg mb-4 leading-relaxed">
              <MathContent>{yesterday.question?.questionText || ""}</MathContent>
            </div>
            <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
              <p className="text-sm font-semibold text-brand-700 mb-2">Solution</p>
              <div className="text-gray-800">
                <MathContent>{yesterday.question?.solutionText || ""}</MathContent>
              </div>
            </div>
            <div className="mt-4 flex gap-8 text-center">
              <div>
                <p className="text-xl font-bold text-brand-800">{yesterday.totalAttempts || 0}</p>
                <p className="text-xs text-gray-400">Attempted</p>
              </div>
              <div>
                <p className="text-xl font-bold text-brand-800">{yesterday.correctAttempts || 0}</p>
                <p className="text-xs text-gray-400">Got it correct</p>
              </div>
            </div>
          </div>
        )}

      </section>
    </main>
  );
}
