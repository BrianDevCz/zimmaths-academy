"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import MathContent from "../../components/MathContent";
import MathKeyboard from "../../components/MathKeyboard";

// ── Detect parts like (a), (b), (c) in question text ─────────
function detectParts(questionText: string): string[] {
  const matches = questionText.match(/\(([a-e])\)/g);
  if (!matches) return [];
  return [...new Set(matches.map((m) => m.replace(/[()]/g, "")))];
}

// ── Answer Input — defined OUTSIDE main component to prevent remount ──
function AnswerInput({
  questionId,
  part,
  value,
  onChange,
  ocrPreview,
  ocrLoading,
  onStartCamera,
  onOpenUpload,
  onClearPreview,
}: {
  questionId: string;
  part: string | null;
  value: string;
  onChange: (v: string) => void;
  ocrPreview: string | undefined;
  ocrLoading: boolean;
  onStartCamera: () => void;
  onOpenUpload: () => void;
  onClearPreview: () => void;
}) {
  return (
    <div className="space-y-2">
      {ocrPreview && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-xs text-gray-500 mb-1">📷 Captured:</p>
          <img src={ocrPreview} alt="Captured" className="max-h-24 rounded object-contain" />
          {ocrLoading && (
            <p className="text-xs text-brand-600 mt-1 animate-pulse">
              Reading your handwriting...
            </p>
          )}
        </div>
      )}

      <MathKeyboard
        value={value}
        onChange={onChange}
        placeholder={part ? `Answer for part (${part})...` : "Type your answer..."}
      />

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={onStartCamera}
          disabled={ocrLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-medium transition"
        >
          📷 Camera
        </button>
        <button
          onClick={onOpenUpload}
          disabled={ocrLoading}
          className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 rounded-lg text-xs font-medium transition"
        >
          🖼️ Upload
        </button>
        {ocrPreview && (
          <button
            onClick={onClearPreview}
            className="px-3 py-1.5 text-red-500 hover:bg-red-50 rounded-lg text-xs transition"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────
export default function PracticeTestPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<{
    [questionId: string]: string | { [part: string]: string };
  }>({});
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);

  const [showCamera, setShowCamera] = useState(false);
  const [cameraTarget, setCameraTarget] = useState<{ questionId: string; part: string | null } | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [ocrLoadingKey, setOcrLoadingKey] = useState<string | null>(null);
  const [ocrPreviews, setOcrPreviews] = useState<{ [key: string]: string }>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileTargetRef = useRef<{ questionId: string; part: string | null } | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("practiceQuestions");
    const settings = sessionStorage.getItem("practiceSettings");
    if (!stored) { router.push("/practice"); return; }
    setQuestions(JSON.parse(stored));
    if (settings) {
      const s = JSON.parse(settings);
      setTimeLeft(parseInt(s.count) * 60);
    }
  }, [router]);

  useEffect(() => { return () => { stopCamera(); }; }, []);

  useEffect(() => {
    if (timeLeft <= 0 || submitted) return;
    const timer = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, submitted]);

  const currentQuestion = questions[currentIndex];
  const currentParts = currentQuestion ? detectParts(currentQuestion.questionText) : [];
  const isMultiPart = currentParts.length > 1;
  const progress = questions.length > 0 ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const formatTime = (s: number) =>
    Math.floor(s / 60) + ":" + (s % 60 < 10 ? "0" : "") + (s % 60);

  const hasAnswer = (qId: string) => {
    const ans = answers[qId];
    if (!ans) return false;
    if (typeof ans === "string") return ans.trim().length > 0;
    return Object.values(ans).some((v) => v.trim().length > 0);
  };

  const handleSingleAnswer = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handlePartAnswer = (questionId: string, part: string, value: string) => {
    setAnswers((prev) => {
      const existing = prev[questionId];
      const partObj = typeof existing === "object" && existing !== null ? existing : {};
      return { ...prev, [questionId]: { ...partObj, [part]: value } };
    });
  };

  const getPartAnswer = (questionId: string, part: string): string => {
    const ans = answers[questionId];
    if (typeof ans === "object" && ans !== null) return (ans as any)[part] || "";
    return "";
  };

  const getSingleAnswer = (questionId: string): string => {
    const ans = answers[questionId];
    return typeof ans === "string" ? ans : "";
  };

  // ── Camera ──────────────────────────────────────────────────
  const startCamera = async (questionId: string, part: string | null) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setCameraTarget({ questionId, part });
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch {
      alert("Could not access camera. Please allow camera permission or use upload.");
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
    await processImage(base64, target.questionId, target.part);
  };

  const openFileUpload = (questionId: string, part: string | null) => {
    fileTargetRef.current = { questionId, part };
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileTargetRef.current) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      await processImage(
        ev.target?.result as string,
        fileTargetRef.current!.questionId,
        fileTargetRef.current!.part
      );
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const processImage = async (base64: string, questionId: string, part: string | null) => {
    const key = `${questionId}:${part || "single"}`;
    setOcrLoadingKey(key);
    setOcrPreviews((prev) => ({ ...prev, [key]: base64 }));
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/practice/ocr`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ imageBase64: base64 }),
        }
      );
      const data = await res.json();
      if (data.success && data.text) {
        part
          ? handlePartAnswer(questionId, part, data.text)
          : handleSingleAnswer(questionId, data.text);
      } else {
        alert("Could not read text from image. Please type your answer.");
      }
    } catch {
      alert("Image processing failed. Please type your answer.");
    } finally {
      setOcrLoadingKey(null);
    }
  };

  const clearPreview = (questionId: string, part: string | null) => {
    const key = `${questionId}:${part || "single"}`;
    setOcrPreviews((prev) => { const n = { ...prev }; delete n[key]; return n; });
    part ? handlePartAnswer(questionId, part, "") : handleSingleAnswer(questionId, "");
  };

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async () => {
    setLoading(true);
    try {
      const answersArray = questions.map((q) => {
        const ans = answers[q.id];
        const parts = detectParts(q.questionText);
        if (parts.length > 1 && typeof ans === "object" && ans !== null) {
          return { questionId: q.id, partAnswers: ans, userAnswer: "" };
        }
        return { questionId: q.id, userAnswer: typeof ans === "string" ? ans : "", partAnswers: null };
      });

      // ADD THIS LINE:
      console.log("Submitting:", JSON.stringify(answersArray, null, 2));
      
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/practice/submit`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            answers: answersArray,
            difficulty: sessionStorage.getItem("practiceSettings")
              ? JSON.parse(sessionStorage.getItem("practiceSettings")!).difficulty
              : "mixed",
            timeTaken: timeLeft,
          }),
        }
      );
      const data = await res.json();
      if (data.success) { setResults(data); setSubmitted(true); }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Results Screen ──────────────────────────────────────────
  if (submitted && results) {
    const summary = results.data?.summary;
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-10 px-6 text-center">
          <h1 className="text-3xl font-bold mb-2">Practice Complete!</h1>
          <p className="text-brand-200">Here are your results</p>
        </section>

        <section className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 text-center">
            <div className={
              "text-7xl font-bold mb-2 " +
              (summary?.scorePercentage >= 70 ? "text-green-500"
                : summary?.scorePercentage >= 50 ? "text-yellow-500" : "text-red-500")
            }>
              {summary?.scorePercentage}%
            </div>
            <p className="text-gray-600 text-xl mb-1">
              {summary?.correctCount} of {summary?.totalQuestions} correct
            </p>
            <p className="text-gray-500 text-sm mb-4">
              {summary?.totalMarksAwarded} / {summary?.totalMarksAvailable} marks
            </p>
            <div className={
              "inline-block px-4 py-2 rounded-full text-sm font-semibold mb-4 " +
              (summary?.scorePercentage >= 70 ? "bg-green-100 text-green-700"
                : summary?.scorePercentage >= 50 ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700")
            }>
              {summary?.scorePercentage >= 70 ? "Excellent work!"
                : summary?.scorePercentage >= 50 ? "Good effort — keep practising!"
                : "Keep studying — you can do it!"}
            </div>
            {summary?.pointsAwarded > 0 && (
              <div className="bg-brand-50 border border-brand-200 rounded-xl px-4 py-3 mt-2">
                <p className="text-brand-700 font-bold text-lg">+{summary.pointsAwarded} points earned! 🏆</p>
                <p className="text-brand-600 text-sm">Check your rank on the leaderboard</p>
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-gray-800">Review Answers</h2>

          {results.data?.results?.map((result: any, index: number) => (
            <div key={result.questionId} className={
              "bg-white rounded-2xl shadow p-6 border-l-4 " +
              (result.isCorrect ? "border-green-500"
                : result.isPartiallyCorrect ? "border-yellow-500" : "border-red-500")
            }>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={
                  "text-sm font-semibold px-2 py-0.5 rounded " +
                  (result.isCorrect ? "bg-green-100 text-green-700"
                    : result.isPartiallyCorrect ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700")
                }>
                  {result.isCorrect ? "✓ Correct" : result.isPartiallyCorrect ? "~ Partial" : "✗ Wrong"}
                </span>
                <span className="text-sm text-gray-500">Q{index + 1} — {result.topic}</span>
                <span className="text-sm font-semibold text-gray-600 ml-auto">
                  {result.marksAwarded}/{result.totalMarks} marks
                </span>
                {result.markingMethod === "ai" && (
                  <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded">
                    ✨ AI marked
                  </span>
                )}
              </div>

              <div className="text-gray-800 mb-3">
                <MathContent>{result.questionText || ""}</MathContent>
              </div>

              {result.questionImageUrl && (
                <img src={result.questionImageUrl} alt="diagram"
                  className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain mb-3" />
              )}

              <div className="space-y-2 text-sm">
                {result.partResults && result.partResults.length > 0 ? (
                  <div className="space-y-2 mt-2">
                    {result.partResults.map((part: any) => (
                      <div key={part.part} className={
                        "flex items-start gap-3 px-3 py-2 rounded-lg " +
                        (part.isCorrect
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200")
                      }>
                        <span className={
                          "text-xs font-bold px-2 py-0.5 rounded mt-0.5 shrink-0 " +
                          (part.isCorrect ? "bg-green-200 text-green-800" : "bg-red-200 text-red-800")
                        }>
                          ({part.part})
                        </span>
                        <div className="flex-1">
                          <span className={
                            "text-xs font-semibold " +
                            (part.isCorrect ? "text-green-700" : "text-red-700")
                          }>
                            {part.isCorrect ? "✓ Correct" : "✗ Wrong"} — {part.marksAwarded} mark{part.marksAwarded !== 1 ? "s" : ""}
                          </span>
                          {result.partAnswers?.[part.part] && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Your answer:{" "}
                              <span className={part.isCorrect ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                {result.partAnswers[part.part]}
                              </span>
                            </p>
                          )}
                          {part.feedback && (
                            <p className="text-xs text-gray-600 mt-0.5">{part.feedback}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <>
                    <p className="text-gray-600">
                      Your answer:{" "}
                      <span className={
                        result.isCorrect ? "text-green-600 font-medium"
                          : result.isPartiallyCorrect ? "text-yellow-600 font-medium"
                          : "text-red-600 font-medium"
                      }>
                        {result.userAnswer || "No answer given"}
                      </span>
                    </p>
                    {!result.isCorrect && result.correctAnswer && (
                      <div className="text-gray-600 flex gap-1 items-baseline flex-wrap">
                        <span>Correct answer:</span>
                        <span className="text-green-600 font-medium">
                          <MathContent>{result.correctAnswer}</MathContent>
                        </span>
                      </div>
                    )}
                  </>
                )}
                {result.feedback && (
                  <p className={
                    "text-xs mt-2 px-3 py-2 rounded-lg " +
                    (result.isCorrect ? "bg-green-50 text-green-700"
                      : result.isPartiallyCorrect ? "bg-yellow-50 text-yellow-700"
                      : "bg-gray-50 text-gray-600")
                  }>
                    {result.feedback}
                  </p>
                )}
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button onClick={() => router.push("/practice")}
              className="flex-1 bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-bold transition">
              New Practice Test
            </button>
            <button onClick={() => router.push("/leaderboard")}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-lg font-bold transition">
              View Leaderboard
            </button>
          </div>
        </section>
      </main>
    );
  }

  if (questions.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading questions...</p>
      </main>
    );
  }

  // ── Test Screen ─────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex flex-col items-center justify-center p-4">
          <p className="text-white text-sm mb-3">Point camera at your handwritten working</p>
          <video ref={videoRef} autoPlay playsInline
            className="w-full max-w-sm rounded-xl border-2 border-white" />
          <div className="flex gap-4 mt-4">
            <button onClick={capturePhoto} className="bg-white text-gray-900 px-6 py-3 rounded-xl font-bold">
              📸 Capture
            </button>
            <button onClick={stopCamera} className="bg-gray-700 text-white px-6 py-3 rounded-xl font-bold">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="bg-brand-800 text-white px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-brand-200">Question {currentIndex + 1} of {questions.length}</span>
            <span className={"text-sm font-semibold " + (timeLeft < 60 ? "text-red-300" : "text-brand-200")}>
              ⏱ {formatTime(timeLeft)}
            </span>
          </div>
          <div className="w-full bg-brand-900 rounded-full h-2">
            <div className="bg-brand-300 h-2 rounded-full transition-all" style={{ width: progress + "%" }} />
          </div>
        </div>
      </div>

      {/* Question */}
      <section className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 mb-6">

          {/* Meta */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-1 rounded font-medium">
              {currentQuestion?.topic?.name}
            </span>
            <span className={
              "text-xs px-2 py-1 rounded capitalize font-medium " +
              (currentQuestion?.difficulty === "easy" ? "bg-green-100 text-green-700"
                : currentQuestion?.difficulty === "hard" ? "bg-red-100 text-red-700"
                : "bg-yellow-100 text-yellow-700")
            }>
              {currentQuestion?.difficulty}
            </span>
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
              {currentQuestion?.marks} marks
            </span>
          </div>

          {/* Question Text */}
          <div className="text-gray-800 text-xl leading-relaxed mb-4">
            <MathContent>{currentQuestion?.questionText || ""}</MathContent>
          </div>

          {/* Question Image */}
          {currentQuestion?.questionImageUrl && (
            <div className="mb-6 flex justify-center">
              <img src={currentQuestion.questionImageUrl} alt="diagram"
                className="max-w-full max-h-80 rounded-lg border border-gray-200 object-contain" />
            </div>
          )}

          {/* Answer inputs */}
          <div className="space-y-5">
            {isMultiPart ? (
              <>
                <p className="text-sm text-gray-500">Answer each part separately:</p>
                {currentParts.map((part) => {
                  const key = `${currentQuestion.id}:${part}`;
                  return (
                    <div key={part} className="border border-gray-200 rounded-xl p-4">
                      <label className="block text-sm font-bold text-brand-700 mb-2">
                        Part ({part})
                      </label>
                      <AnswerInput
                        questionId={currentQuestion.id}
                        part={part}
                        value={getPartAnswer(currentQuestion.id, part)}
                        onChange={(v) => handlePartAnswer(currentQuestion.id, part, v)}
                        ocrPreview={ocrPreviews[key]}
                        ocrLoading={ocrLoadingKey === key}
                        onStartCamera={() => startCamera(currentQuestion.id, part)}
                        onOpenUpload={() => openFileUpload(currentQuestion.id, part)}
                        onClearPreview={() => clearPreview(currentQuestion.id, part)}
                      />
                    </div>
                  );
                })}
              </>
            ) : (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Answer
                </label>
                <AnswerInput
                  questionId={currentQuestion.id}
                  part={null}
                  value={getSingleAnswer(currentQuestion.id)}
                  onChange={(v) => handleSingleAnswer(currentQuestion.id, v)}
                  ocrPreview={ocrPreviews[`${currentQuestion.id}:single`]}
                  ocrLoading={ocrLoadingKey === `${currentQuestion.id}:single`}
                  onStartCamera={() => startCamera(currentQuestion.id, null)}
                  onOpenUpload={() => openFileUpload(currentQuestion.id, null)}
                  onClearPreview={() => clearPreview(currentQuestion.id, null)}
                />
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400 mt-3">
            📸 You can photo your handwritten working — our AI will read and mark it
          </p>
        </div>

        {/* Navigation */}
        <div className="flex gap-3 mb-4">
          <button onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="flex-1 bg-white hover:bg-gray-50 disabled:opacity-40 text-gray-700 py-3 rounded-lg font-semibold border border-gray-200 transition">
            Previous
          </button>
          {currentIndex < questions.length - 1 ? (
            <button onClick={() => setCurrentIndex((i) => i + 1)}
              className="flex-1 bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
              Next Question
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-green-300 text-white py-3 rounded-lg font-bold transition">
              {loading ? "Marking with AI..." : "Submit Test"}
            </button>
          )}
        </div>

        {currentIndex < questions.length - 1 && (
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-green-600 hover:bg-green-500 disabled:bg-green-300 text-white py-3 rounded-lg font-bold transition">
            {loading ? "Marking with AI..." : "Submit Test Early"}
          </button>
        )}

        {/* Question dots */}
        <div className="flex gap-2 justify-center mt-6 flex-wrap">
          {questions.map((q, i) => (
            <button key={q.id} onClick={() => setCurrentIndex(i)} className={
              "w-8 h-8 rounded-full text-xs font-bold transition " +
              (i === currentIndex ? "bg-brand-700 text-white"
                : hasAnswer(q.id) ? "bg-green-500 text-white"
                : "bg-gray-200 text-gray-600")
            }>
              {i + 1}
            </button>
          ))}
        </div>
      </section>
    </main>
  );
}