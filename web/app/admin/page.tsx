"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import * as LR from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";
import MathContent from "../components/MathContent";
import LatexCheatSheet from "../components/LatexCheatSheet";

export default function AdminPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Paper form
  const [paperForm, setPaperForm] = useState({
    title: "", year: new Date().getFullYear(), session: "november", paperNumber: 1,
  });

  // Question form
  const [questionForm, setQuestionForm] = useState({
    paperId: "", topicId: "", questionNumber: 1, questionText: "",
    marks: 1, difficulty: "medium", correctAnswer: "", solutionText: "",
    isFree: false, isDailyEligible: false, questionImageUrl: "",
  });

  // Lesson form
  const [lessonForm, setLessonForm] = useState({
    topicId: "", title: "", content: "", orderIndex: 1,
    isFree: false, estimatedMinutes: 10, videoUrl: "", geogebraUrl: "", imageUrl: "",
  });

  // Helper function to always get fresh headers with the latest token
  const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem("zim_token")}`,
  "Content-Type": "application/json"
});

  // Helper function to get headers without Content-Type (for file uploads)
  const getAuthHeaders = () => ({
    Authorization: `Bearer ${token}`
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) {
      router.push("/login?redirect=/admin");
      return;
    }

    fetchStats();
    fetchTopics();
  }, [token, authLoading, user]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "papers") fetchPapers();
    if (activeTab === "questions") { fetchPapers(); fetchPracticeQuestions(); }
    if (activeTab === "lessons") fetchLessons();
    if (activeTab === "subscriptions") fetchSubscriptions();
  }, [activeTab, token]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/stats", { headers: getHeaders() });
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      if (data.success) setStats(data.data);
      else setError(data.error);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch { setError("Failed to load users."); }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/papers", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPapers(data.data);
    } catch { setError("Failed to load papers."); }
  };

  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/questions?paperId=${paperId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setQuestions(data.data);
    } catch { setError("Failed to load questions."); }
  };

  const fetchPracticeQuestions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/questions?practiceOnly=true", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPracticeQuestions(data.data);
    } catch { setError("Failed to load practice questions."); }
  };

  const fetchLessons = async (topicId?: string) => {
    try {
      const url = topicId
        ? `http://localhost:5000/api/admin/lessons?topicId=${topicId}`
        : "http://localhost:5000/api/admin/lessons";
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setLessons(data.data);
    } catch { setError("Failed to load lessons."); }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/subscriptions", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setSubscriptions(data.data);
    } catch { setError("Failed to load subscriptions."); }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/topics", { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch {}
  };

  const handleAddPaper = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/papers", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...paperForm,
          year: parseInt(String(paperForm.year)),
          paperNumber: parseInt(String(paperForm.paperNumber)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Paper added successfully!");
        fetchPapers();
        setPaperForm({ title: "", year: new Date().getFullYear(), session: "november", paperNumber: 1 });
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add paper."); }
  };

  const handleAddQuestion = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/questions", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...questionForm,
          paperId: questionForm.paperId || null,
          questionNumber: parseInt(String(questionForm.questionNumber)),
          marks: parseInt(String(questionForm.marks)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Question added successfully!");
        if (questionForm.paperId) fetchQuestions(questionForm.paperId);
        fetchPracticeQuestions();
        setQuestionForm((prev) => ({
          ...prev,
          questionNumber: prev.questionNumber + 1,
          questionText: "",
          correctAnswer: "",
          solutionText: "",
          questionImageUrl: "",
        }));
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add question."); }
  };

  const handleAddLesson = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/lessons", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          ...lessonForm,
          orderIndex: parseInt(String(lessonForm.orderIndex)),
          estimatedMinutes: parseInt(String(lessonForm.estimatedMinutes)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Lesson added successfully!");
        fetchLessons(lessonForm.topicId || undefined);
        setLessonForm((prev) => ({
          ...prev, title: "", content: "", videoUrl: "", orderIndex: prev.orderIndex + 1,
        }));
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add lesson."); }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Delete this paper and all its questions?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/papers/${id}`, { method: "DELETE", headers: getHeaders() });
      fetchPapers();
    } catch { setError("Failed to delete paper."); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/questions/${id}`, { method: "DELETE", headers: getHeaders() });
      if (questionForm.paperId) fetchQuestions(questionForm.paperId);
      fetchPracticeQuestions();
    } catch { setError("Failed to delete question."); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/lessons/${id}`, { method: "DELETE", headers: getHeaders() });
      fetchLessons();
    } catch { setError("Failed to delete lesson."); }
  };

  const downloadTemplate = () => {
    const csv = [
      "topicSlug,questionNumber,questionText,marks,difficulty,correctAnswer,solutionText,isFree,isDailyEligible,questionImageUrl,paperTitle",
      'general-arithmetic,1,"Simplify $\\frac{3}{4} + \\frac{1}{2}$",2,easy,"$\\frac{5}{4}$","Convert to common denominator",true,true,,',
      'algebra,2,"Solve $2x + 3 = 11$",2,easy,"$x = 4$","$2x = 8$ so $x = 4$",true,false,,"ZimMaths Practice Paper — November 2024 Paper 1"',
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "zimmaths_questions_template.csv";
    a.click();
  };

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      const headers = lines[0].split(",").map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const values: string[] = [];
        let current = "";
        let inQuotes = false;
        for (const char of line) {
          if (char === '"') { inQuotes = !inQuotes; }
          else if (char === "," && !inQuotes) { values.push(current.trim()); current = ""; }
          else { current += char; }
        }
        values.push(current.trim());
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = values[i] || ""; });
        return obj;
      });
      setCsvPreview(rows);
      setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    // Check token first
    if (!token) {
      setFormError("You must be logged in to import questions.");
      return;
    }

    setImportLoading(true);
    setImportResult(null);
    
    try {
      const res = await fetch("http://localhost:5000/api/admin/questions/import", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({ questions: csvPreview }),
      });
      
      console.log("Import response status:", res.status);
      
      // Check if response is ok
      if (!res.ok) {
        const text = await res.text();
        console.error("Server error response:", text.substring(0, 200));
        throw new Error(`Server error ${res.status}: ${text.substring(0, 100)}`);
      }
      
      const data = await res.json();
      console.log("Import data:", data);
      
      if (data.success) {
        setImportResult(data.data);
        setCsvPreview([]);
        fetchPracticeQuestions();
        if (questionForm.paperId) fetchQuestions(questionForm.paperId);
        setFormMessage(`Successfully imported ${data.data.imported} questions!`);
      } else {
        setFormError(data.error || "Import failed");
      }
    } catch (err: any) {
      console.error("Import error:", err);
      setFormError("Failed to import questions: " + (err?.message || "Unknown error"));
    } finally {
      setImportLoading(false);
    }
  };

  const handleActivateSubscription = async (userId: string, plan: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/subscriptions/${userId}/activate`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Subscription activated!");
        fetchSubscriptions();
        fetchUsers();
      } else {
        setFormError(data.error);
      }
    } catch { setError("Failed to activate subscription."); }
  };

  const tabs = [
    { id: "stats", label: "📊 Dashboard" },
    { id: "papers", label: "📄 Papers" },
    { id: "questions", label: "❓ Questions" },
    { id: "lessons", label: "📚 Lessons" },
    { id: "users", label: "👥 Users" },
    { id: "subscriptions", label: "💳 Subscriptions" },
  ];

  if (loading && activeTab === "stats") {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading admin panel...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>
            <p className="text-brand-200 text-sm">ZimMaths Academy — Content Management</p>
          </div>
          <Link href="/" className="text-brand-300 hover:text-white text-sm transition">← Back to Site</Link>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-700"
                  : "border-transparent text-gray-500 hover:text-brand-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">⚠️ {error}</div>
        )}
        {formMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">✅ {formMessage}</div>
        )}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">⚠️ {formError}</div>
        )}

        {/* STATS TAB */}
        {activeTab === "stats" && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers, icon: "👥" },
                { label: "Total Papers", value: stats.totalPapers, icon: "📄" },
                { label: "Total Questions", value: stats.totalQuestions, icon: "❓" },
                { label: "Active Premium", value: stats.activeSubscriptions, icon: "⭐" },
                { label: "Total Revenue", value: `$${stats.totalRevenue}`, icon: "💰" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow p-5 text-center">
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <p className="text-2xl font-bold text-brand-800">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🆕 Recent Registrations</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Grade</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Role</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentUsers.map((u: any) => (
                      <tr key={u.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-800">{u.name}</td>
                        <td className="py-3 text-gray-500">{u.email}</td>
                        <td className="py-3 text-gray-500 capitalize">{u.grade?.replace("form", "Form ")}</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAPERS TAB */}
        {activeTab === "papers" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Add New Paper</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input type="text" value={paperForm.title} onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                    placeholder="e.g. ZimMaths Practice Paper — November 2024 Paper 1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                  <input type="number" value={paperForm.year} onChange={(e) => setPaperForm({ ...paperForm, year: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Session</label>
                  <select value={paperForm.session} onChange={(e) => setPaperForm({ ...paperForm, session: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="june">June</option>
                    <option value="november">November</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper Number</label>
                  <select value={paperForm.paperNumber} onChange={(e) => setPaperForm({ ...paperForm, paperNumber: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value={1}>Paper 1</option>
                    <option value={2}>Paper 2</option>
                  </select>
                </div>
              </div>
              <button onClick={handleAddPaper} className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                Add Paper
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📄 All Papers ({papers.length})</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-2 text-gray-500 font-medium">Title</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Year</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Session</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Paper</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Questions</th>
                      <th className="text-left py-2 text-gray-500 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {papers.map((paper: any) => (
                      <tr key={paper.id} className="border-b border-gray-50">
                        <td className="py-3 font-medium text-gray-800">{paper.title}</td>
                        <td className="py-3 text-gray-500">{paper.year}</td>
                        <td className="py-3 text-gray-500 capitalize">{paper.session}</td>
                        <td className="py-3 text-gray-500">Paper {paper.paperNumber}</td>
                        <td className="py-3 text-gray-500">{paper._count?.questions || 0}</td>
                        <td className="py-3">
                          <button onClick={() => handleDeletePaper(paper.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {papers.length === 0 && (
                      <tr><td colSpan={6} className="py-8 text-center text-gray-400">No papers yet</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === "questions" && (
          <div className="space-y-6">

            {/* CSV Batch Import */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">📥 Batch Import Questions</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV to add multiple questions at once.{" "}
                <button onClick={downloadTemplate} className="text-brand-600 hover:underline text-sm font-semibold">
                  Download template
                </button>
              </p>

              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs text-gray-500 space-y-1">
                <p className="font-semibold text-gray-700">CSV Column Guide:</p>
                <p><span className="font-mono bg-white px-1 rounded">topicSlug</span> — e.g. general-arithmetic, algebra, geometry</p>
                <p><span className="font-mono bg-white px-1 rounded">questionNumber</span> — number to order questions (fill gaps with admin form)</p>
                <p><span className="font-mono bg-white px-1 rounded">questionText</span> — wrap in quotes, use \\frac for LaTeX</p>
                <p><span className="font-mono bg-white px-1 rounded">marks, difficulty</span> — difficulty: easy/medium/hard</p>
                <p><span className="font-mono bg-white px-1 rounded">isFree, isDailyEligible</span> — true or false</p>
                <p><span className="font-mono bg-white px-1 rounded">questionImageUrl</span> — Uploadcare URL or leave blank</p>
                <p><span className="font-mono bg-white px-1 rounded">paperTitle</span> — exact paper title or leave blank for practice-only</p>
              </div>

              <input
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer"
              />

              {csvPreview.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">
                    Preview — {csvPreview.length} questions ready to import:
                  </p>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                    {csvPreview.slice(0, 5).map((q: any, i: number) => (
                      <div key={i} className="text-xs bg-gray-50 rounded px-3 py-2 flex gap-2 items-center">
                        <span className="text-brand-600 font-medium w-24 flex-shrink-0">{q.topicSlug}</span>
                        <span className="text-gray-400 w-6 flex-shrink-0">Q{q.questionNumber}</span>
                        <span className="text-gray-600 truncate flex-1">{q.questionText}</span>
                        <span className="text-gray-400 flex-shrink-0">{q.marks}m</span>
                        <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-xs ${
                          q.difficulty === "easy" ? "bg-green-100 text-green-700" :
                          q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                          "bg-yellow-100 text-yellow-700"
                        }`}>{q.difficulty}</span>
                      </div>
                    ))}
                    {csvPreview.length > 5 && (
                      <p className="text-xs text-gray-400 text-center py-1">
                        ...and {csvPreview.length - 5} more questions
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={handleBatchImport}
                      disabled={importLoading}
                      className="bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
                    >
                      {importLoading ? "Importing..." : `Import ${csvPreview.length} Questions`}
                    </button>
                    <button
                      onClick={() => { setCsvPreview([]); setImportResult(null); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {importResult && (
                <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${
                  importResult.failed > 0 ? "bg-yellow-50 border border-yellow-200 text-yellow-700" 
                  : "bg-green-50 border border-green-200 text-green-700"
                }`}>
                  <p className="font-semibold">✅ {importResult.imported} questions imported successfully{importResult.failed > 0 ? `, ⚠️ ${importResult.failed} failed` : ""}</p>
                  {importResult.errors?.map((e: string, i: number) => (
                    <p key={i} className="text-xs mt-1">{e}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Add Question Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Add New Question</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Paper <span className="text-gray-400 font-normal text-xs">(optional — leave blank for practice-only)</span>
                  </label>
                  <select
                    value={questionForm.paperId}
                    onChange={(e) => {
                      setQuestionForm({ ...questionForm, paperId: e.target.value });
                      if (e.target.value) fetchQuestions(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">No paper — Practice question only</option>
                    {papers.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
                  <select
                    value={questionForm.topicId}
                    onChange={(e) => setQuestionForm({ ...questionForm, topicId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select a topic...</option>
                    {topics.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Question Number</label>
                  <input type="number" value={questionForm.questionNumber}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionNumber: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Marks</label>
                  <input type="number" value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
                  <select value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer</label>
                  <input type="text" value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    placeholder="e.g. 13 or $x = 3$ or $\frac{2}{3}$"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 font-mono" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    placeholder="e.g. Simplify $2\frac{1}{2} \div 3\frac{3}{4} + 1\frac{1}{5}$"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono"
                  />
                  <LatexCheatSheet />
                </div>

                {/* Preview */}
                {questionForm.questionText && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Preview</label>
                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-800">
                      <MathContent>{questionForm.questionText}</MathContent>
                    </div>
                  </div>
                )}

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question Diagram / Image <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <LR.FileUploaderRegular
                    pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || ""}
                    imgOnly={true}
                    multiple={false}
                    onFileUploadSuccess={(file: any) => {
                      setQuestionForm({ ...questionForm, questionImageUrl: file.cdnUrl });
                      setFormMessage("Image uploaded successfully!");
                    }}
                    onFileUploadFailed={() => setFormError("Image upload failed.")}
                  />
                  {questionForm.questionImageUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-green-600 mb-2">✅ Image uploaded</p>
                      <img src={questionForm.questionImageUrl} alt="Question diagram"
                        className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain" />
                      <button onClick={() => setQuestionForm({ ...questionForm, questionImageUrl: "" })}
                        className="mt-2 text-xs text-red-500 hover:text-red-700">Remove image</button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Solution / Working</label>
                  <textarea value={questionForm.solutionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, solutionText: e.target.value })}
                    placeholder="Enter the full solution with working... LaTeX supported: $\frac{n}{2}$"
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono" />
                </div>

                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={questionForm.isFree}
                      onChange={(e) => setQuestionForm({ ...questionForm, isFree: e.target.checked })}
                      className="w-4 h-4 accent-brand-600" />
                    Free question
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={questionForm.isDailyEligible}
                      onChange={(e) => setQuestionForm({ ...questionForm, isDailyEligible: e.target.checked })}
                      className="w-4 h-4 accent-brand-600" />
                    Daily challenge eligible
                  </label>
                </div>

              </div>

              <button onClick={handleAddQuestion}
                className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                Add Question
              </button>
            </div>

            {/* Paper Questions List */}
            {questions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📄 Paper Questions ({questions.length})</h2>
                <div className="space-y-3">
                  {questions.map((q: any) => (
                    <div key={q.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">Q{q.questionNumber}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded capitalize">{q.difficulty}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{q.marks} marks</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{q.topic?.name}</span>
                          {q.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          {q.questionImageUrl && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">📷 Image</span>}
                        </div>
                        <div className="text-sm text-gray-800">
                          <MathContent>{q.questionText || ""}</MathContent>
                        </div>
                        {q.correctAnswer && (
                          <div className="text-xs text-green-600 mt-1 flex gap-1 items-center">
                            <span>Answer:</span>
                            <MathContent>{q.correctAnswer}</MathContent>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex-shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice-Only Questions List */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                ✏️ Practice-Only Questions ({practiceQuestions.length})
              </h2>
              {practiceQuestions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">
                  No practice-only questions yet. Add a question without selecting a paper.
                </p>
              ) : (
                <div className="space-y-3">
                  {practiceQuestions.map((q: any) => (
                    <div key={q.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">Q{q.questionNumber}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded capitalize">{q.difficulty}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{q.marks} marks</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{q.topic?.name}</span>
                          {q.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          {q.isDailyEligible && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Daily eligible</span>}
                        </div>
                        <div className="text-sm text-gray-800">
                          <MathContent>{q.questionText || ""}</MathContent>
                        </div>
                        {q.correctAnswer && (
                          <div className="text-xs text-green-600 mt-1 flex gap-1 items-center">
                            <span>Answer:</span>
                            <MathContent>{q.correctAnswer}</MathContent>
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex-shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* LESSONS TAB */}
        {activeTab === "lessons" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Add New Lesson</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
                  <select value={lessonForm.topicId}
                    onChange={(e) => { setLessonForm({ ...lessonForm, topicId: e.target.value }); if (e.target.value) fetchLessons(e.target.value); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="">Select a topic...</option>
                    {topics.map((t: any) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lesson Title</label>
                  <input type="text" value={lessonForm.title}
                    onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Algebra"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                  <input type="number" value={lessonForm.orderIndex}
                    onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Minutes</label>
                  <input type="number" value={lessonForm.estimatedMinutes}
                    onChange={(e) => setLessonForm({ ...lessonForm, estimatedMinutes: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    YouTube Video URL <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={lessonForm.videoUrl}
                    onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="e.g. https://www.youtube.com/watch?v=..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Lesson Diagram / Image <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <LR.FileUploaderRegular
                    pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || ""}
                    imgOnly={true}
                    multiple={false}
                    onFileUploadSuccess={(file: any) => {
                      setLessonForm({ ...lessonForm, imageUrl: file.cdnUrl });
                      setFormMessage("Image uploaded successfully!");
                    }}
                    onFileUploadFailed={() => setFormError("Image upload failed.")}
                  />
                  {lessonForm.imageUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-green-600 mb-2">✅ Image uploaded</p>
                      <img src={lessonForm.imageUrl} alt="Lesson diagram"
                        className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain" />
                      <button onClick={() => setLessonForm({ ...lessonForm, imageUrl: "" })}
                        className="mt-2 text-xs text-red-500 hover:text-red-700">Remove image</button>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lesson Content</label>
                  <textarea value={lessonForm.content}
                    onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder="Enter lesson content. Supports LaTeX math: $\frac{n}{2}$ and Markdown."
                    rows={8}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono" />
                  <LatexCheatSheet />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={lessonForm.isFree}
                      onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })}
                      className="w-4 h-4 accent-brand-600" />
                    Free lesson
                  </label>
                </div>
              </div>
              <button onClick={handleAddLesson}
                className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                Add Lesson
              </button>
            </div>

            {lessons.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📚 Lessons ({lessons.length})</h2>
                <div className="space-y-3">
                  {lessons.map((lesson: any) => (
                    <div key={lesson.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">#{lesson.orderIndex}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{lesson.estimatedMinutes} min</span>
                          {lesson.videoUrl && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">🎥 Video</span>}
                          {lesson.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{lesson.topic?.name}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                          {lesson.content?.replace(/<[^>]*>/g, "").substring(0, 80)}...
                        </p>
                      </div>
                      <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold flex-shrink-0">Delete</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">👥 All Users ({users.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Name</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Grade</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Role</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Premium</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Joined</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u: any) => (
                    <tr key={u.id} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-800">{u.name}</td>
                      <td className="py-3 text-gray-500">{u.email}</td>
                      <td className="py-3 text-gray-500 capitalize">{u.grade?.replace("form", "Form ")}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.subscription?.status === "active" ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">⭐ {u.subscription.plan}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </td>
                      <td className="py-3">
                        <select onChange={(e) => { if (e.target.value) handleActivateSubscription(u.id, e.target.value); e.target.value = ""; }}
                          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600" defaultValue="">
                          <option value="">Activate...</option>
                          <option value="two_weeks">2 Weeks</option>
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">No users yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === "subscriptions" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">💳 All Subscriptions ({subscriptions.length})</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Student</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Plan</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Amount</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Expires</th>
                    <th className="text-left py-2 text-gray-500 font-medium">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-800">{s.user?.name}</td>
                      <td className="py-3 text-gray-500">{s.user?.email}</td>
                      <td className="py-3 text-gray-500 capitalize">{s.plan?.replace("_", " ")}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          s.status === "active" ? "bg-green-100 text-green-700" :
                          s.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>{s.status}</span>
                      </td>
                      <td className="py-3 text-gray-500">${s.amountUsd}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(s.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3 text-gray-400 text-xs font-mono">{s.paymentReference}</td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr><td colSpan={7} className="py-8 text-center text-gray-400">No subscriptions yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}