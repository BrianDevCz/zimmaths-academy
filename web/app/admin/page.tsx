"use client";
import { API_URL } from '@/app/lib/api';
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import MathContent from "../components/MathContent";
import LatexCheatSheet from "../components/LatexCheatSheet";

const UPLOADCARE_PUBLIC_KEY = "7e4e42ae6a4d7550d670";
const UPLOADCARE_CDN = "https://d9s36eq1lg.ucarecd.net";

async function uploadImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("UPLOADCARE_PUB_KEY", UPLOADCARE_PUBLIC_KEY);
  formData.append("UPLOADCARE_STORE", "auto");
  formData.append("file", file);
  const res = await fetch("https://upload.uploadcare.com/base/", { method: "POST", body: formData });
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
  const data = await res.json();
  if (!data.file) throw new Error("No file ID returned from Uploadcare");
  return `${UPLOADCARE_CDN}/${data.file}/`;
}

export default function AdminPage() {
  const { token, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [practiceQuestions, setPracticeQuestions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [dailyChallenges, setDailyChallenges] = useState<any[]>([]);
  const [eligibleQuestions, setEligibleQuestions] = useState<any[]>([]);
  const [badgeStats, setBadgeStats] = useState<any[]>([]);
  const [recentBadges, setRecentBadges] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [userPage, setUserPage] = useState(0);
  const [userTotal, setUserTotal] = useState(0);
  const [userTotalPages, setUserTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [csvPreview, setCsvPreview] = useState<any[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);
  const [selectedPaperId, setSelectedPaperId] = useState<string>("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Daily challenge form
  const [challengeForm, setChallengeForm] = useState({ questionId: "", date: "" });

  const [paperForm, setPaperForm] = useState({
    title: "", year: new Date().getFullYear(), session: "november", paperNumber: 1, isFree: false,
  });

  const [questionForm, setQuestionForm] = useState({
    paperId: "", topicId: "", questionNumber: 1, questionText: "",
    marks: 1, difficulty: "medium", correctAnswer: "", solutionText: "",
    isFree: false, isDailyEligible: false, questionImageUrl: "",
  });

  const [lessonForm, setLessonForm] = useState({
    topicId: "", title: "", content: "", orderIndex: 1,
    isFree: false, estimatedMinutes: 10, videoUrl: "", geogebraUrl: "", imageUrl: "",
  });

  const getHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("zim_token")}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    if (authLoading) return;
    if (!token) { router.push("/login?redirect=/admin"); return; }
    fetchStats();
    fetchTopics();
  }, [token, authLoading]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "papers") fetchPapers();
    if (activeTab === "questions") {
      fetchPapers();
      fetchPracticeQuestions();
      if (selectedPaperId) fetchQuestions(selectedPaperId);
    }
    if (activeTab === "lessons") fetchLessons();
    if (activeTab === "subscriptions") fetchSubscriptions();
    if (activeTab === "daily") { fetchDailyChallenges(); fetchEligibleQuestions(); }
    if (activeTab === "badges") fetchBadgeStats();
    if (activeTab === "analytics") fetchAnalytics();
  }, [activeTab, token, selectedPaperId]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/stats`, { headers: getHeaders() });
      if (res.status === 403) { router.push("/"); return; }
      const data = await res.json();
      if (data.success) setStats(data.data);
      else setError(data.error);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const fetchUsers = async (search?: string, page = 0) => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("page", String(page));
      const res = await fetch(`${API_URL}/api/admin/users?${params}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data);
        setUserTotal(data.total);
        setUserTotalPages(data.totalPages);
        setUserPage(page);
      }
    } catch { setError("Failed to load users."); }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/papers`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPapers(data.data);
    } catch { setError("Failed to load papers."); }
  };

  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/questions?paperId=${paperId}`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setQuestions(data.data);
    } catch { setError("Failed to load questions."); }
  };

  const fetchPracticeQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/questions?practiceOnly=true`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setPracticeQuestions(data.data);
    } catch { setError("Failed to load practice questions."); }
  };

  const fetchLessons = async (topicId?: string) => {
    try {
      const url = topicId ? `${API_URL}/api/admin/lessons?topicId=${topicId}` : `${API_URL}/api/admin/lessons`;
      const res = await fetch(url, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setLessons(data.data);
    } catch { setError("Failed to load lessons."); }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setSubscriptions(data.data);
    } catch { setError("Failed to load subscriptions."); }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/topics`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch {}
  };

  const fetchDailyChallenges = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-challenges`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setDailyChallenges(data.data);
    } catch { setError("Failed to load daily challenges."); }
  };

  const fetchEligibleQuestions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-eligible-questions`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setEligibleQuestions(data.data);
    } catch {}
  };

  const fetchBadgeStats = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/badges`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) { setBadgeStats(data.data.badgeStats); setRecentBadges(data.data.recentBadges); }
    } catch { setError("Failed to load badge stats."); }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/analytics`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success) setAnalytics(data.data);
    } catch { setError("Failed to load analytics."); }
  };

  const handleScheduleChallenge = async () => {
    setFormError(""); setFormMessage("");
    if (!challengeForm.questionId || !challengeForm.date) {
      setFormError("Please select a question and date."); return;
    }
    try {
      const res = await fetch(`${API_URL}/api/admin/daily-challenges`, {
        method: "POST", headers: getHeaders(),
        body: JSON.stringify(challengeForm),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Challenge scheduled successfully!");
        setChallengeForm({ questionId: "", date: "" });
        fetchDailyChallenges();
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to schedule challenge."); }
  };

  const handleDeleteChallenge = async (id: string) => {
    if (!confirm("Delete this challenge? All attempts will also be deleted.")) return;
    try {
      await fetch(`${API_URL}/api/admin/daily-challenges/${id}`, { method: "DELETE", headers: getHeaders() });
      fetchDailyChallenges();
      setFormMessage("Challenge deleted.");
    } catch { setFormError("Failed to delete challenge."); }
  };

  const handleAddPaper = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/papers`, {
        method: "POST", headers: getHeaders(),
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
        setPaperForm({ title: "", year: new Date().getFullYear(), session: "november", paperNumber: 1, isFree: false });
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add paper."); }
  };

  const handleTogglePaperFree = async (paperId: string, currentValue: boolean) => {
    try {
      await fetch(`${API_URL}/api/admin/papers/${paperId}`, {
        method: "PUT", headers: getHeaders(),
        body: JSON.stringify({ isFree: !currentValue }),
      });
      fetchPapers();
    } catch { setFormError("Failed to update paper."); }
  };

  const handleAddQuestion = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/questions`, {
        method: "POST", headers: getHeaders(),
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
          ...prev, questionNumber: prev.questionNumber + 1,
          questionText: "", correctAnswer: "", solutionText: "", questionImageUrl: "",
        }));
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add question."); }
  };

  const handleEditQuestion = (q: any) => {
    setEditingQuestionId(q.id);
    setQuestionForm({
      paperId: q.paperId || "", topicId: q.topicId || "", questionNumber: q.questionNumber,
      questionText: q.questionText, marks: q.marks, difficulty: q.difficulty,
      correctAnswer: q.correctAnswer || "", solutionText: q.solutionText || "",
      isFree: q.isFree, isDailyEligible: q.isDailyEligible, questionImageUrl: q.questionImageUrl || "",
    });
    if (q.paperId) { setSelectedPaperId(q.paperId); fetchQuestions(q.paperId); }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateQuestion = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/questions/${editingQuestionId}`, {
        method: "PUT", headers: getHeaders(),
        body: JSON.stringify({
          ...questionForm, paperId: questionForm.paperId || null,
          questionNumber: parseInt(String(questionForm.questionNumber)),
          marks: parseInt(String(questionForm.marks)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Question updated successfully!");
        setEditingQuestionId(null);
        setQuestionForm({ paperId: "", topicId: "", questionNumber: 1, questionText: "", marks: 1, difficulty: "medium", correctAnswer: "", solutionText: "", isFree: false, isDailyEligible: false, questionImageUrl: "" });
        if (questionForm.paperId) fetchQuestions(questionForm.paperId);
        fetchPracticeQuestions();
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to update question."); }
  };

  const handleAddLesson = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/lessons`, {
        method: "POST", headers: getHeaders(),
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
        setLessonForm((prev) => ({ ...prev, title: "", content: "", videoUrl: "", imageUrl: "", orderIndex: prev.orderIndex + 1 }));
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to add lesson."); }
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLessonId(lesson.id);
    setLessonForm({
      topicId: lesson.topicId || "", title: lesson.title, content: lesson.content,
      orderIndex: lesson.orderIndex, isFree: lesson.isFree, estimatedMinutes: lesson.estimatedMinutes,
      videoUrl: lesson.videoUrl || "", geogebraUrl: lesson.geogebraUrl || "", imageUrl: lesson.imageUrl || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleUpdateLesson = async () => {
    setFormError(""); setFormMessage("");
    try {
      const res = await fetch(`${API_URL}/api/admin/lessons/${editingLessonId}`, {
        method: "PUT", headers: getHeaders(),
        body: JSON.stringify({
          ...lessonForm,
          orderIndex: parseInt(String(lessonForm.orderIndex)),
          estimatedMinutes: parseInt(String(lessonForm.estimatedMinutes)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Lesson updated successfully!");
        setEditingLessonId(null);
        setLessonForm({ topicId: "", title: "", content: "", orderIndex: 1, isFree: false, estimatedMinutes: 10, videoUrl: "", geogebraUrl: "", imageUrl: "" });
        fetchLessons();
      } else { setFormError(data.error); }
    } catch { setFormError("Failed to update lesson."); }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Delete this paper and all its questions?")) return;
    try {
      await fetch(`${API_URL}/api/admin/papers/${id}`, { method: "DELETE", headers: getHeaders() });
      fetchPapers();
    } catch { setError("Failed to delete paper."); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await fetch(`${API_URL}/api/admin/questions/${id}`, { method: "DELETE", headers: getHeaders() });
      if (selectedPaperId) fetchQuestions(selectedPaperId);
      fetchPracticeQuestions();
    } catch { setError("Failed to delete question."); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Delete this lesson?")) return;
    try {
      await fetch(`${API_URL}/api/admin/lessons/${id}`, { method: "DELETE", headers: getHeaders() });
      fetchLessons();
    } catch { setError("Failed to delete lesson."); }
  };

  const handleActivateSubscription = async (userId: string, plan: string) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${userId}/activate`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) { setFormMessage("Subscription activated!"); fetchSubscriptions(); fetchUsers(); }
      else { setFormError(data.error); }
    } catch { setError("Failed to activate subscription."); }
  };

  const handleCancelSubscription = async (userId: string) => {
    if (!confirm("Cancel this subscription?")) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/subscriptions/${userId}/cancel`, {
        method: "PUT", headers: getHeaders(), body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) { setFormMessage("Subscription cancelled."); fetchSubscriptions(); fetchUsers(); }
    } catch { setFormError("Failed to cancel subscription."); }
  };

  const downloadTemplate = () => {
    const csv = [
      "topicSlug,questionNumber,questionText,marks,difficulty,correctAnswer,solutionText,isFree,isDailyEligible,questionImageUrl,paperTitle",
      'general-arithmetic,1,"Simplify $\\frac{3}{4} + \\frac{1}{2}$",2,easy,"$\\frac{5}{4}$","Convert to common denominator",true,true,,',
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "zimmaths_questions_template.csv"; a.click();
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
        let current = ""; let inQuotes = false;
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
      setCsvPreview(rows); setImportResult(null);
    };
    reader.readAsText(file);
  };

  const handleBatchImport = async () => {
    if (!token) { setFormError("You must be logged in."); return; }
    setImportLoading(true); setImportResult(null);
    try {
      const res = await fetch(`${API_URL}/api/admin/questions/import`, {
        method: "POST", headers: getHeaders(), body: JSON.stringify({ questions: csvPreview }),
      });
      const data = await res.json();
      if (data.success) {
        setImportResult(data.data); setCsvPreview([]);
        fetchPracticeQuestions();
        if (selectedPaperId) fetchQuestions(selectedPaperId);
        setFormMessage(`Successfully imported ${data.data.imported} questions!`);
      } else { setFormError(data.error || "Import failed"); }
    } catch (err: any) {
      setFormError("Failed to import: " + (err?.message || "Unknown error"));
    } finally { setImportLoading(false); }
  };

  const tabs = [
    { id: "stats", label: "📊 Dashboard" },
    { id: "analytics", label: "📈 Analytics" },
    { id: "daily", label: "📅 Daily Challenges" },
    { id: "papers", label: "📄 Papers" },
    { id: "questions", label: "❓ Questions" },
    { id: "lessons", label: "📚 Lessons" },
    { id: "users", label: "👥 Users" },
    { id: "subscriptions", label: "💳 Subscriptions" },
    { id: "badges", label: "🏅 Badges" },
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
      <section className="bg-brand-800 text-white py-6 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">⚙️ Admin Panel</h1>
            <p className="text-brand-200 text-sm">ZimMaths Academy — Content Management</p>
          </div>
          <Link href="/" className="text-brand-300 hover:text-white text-sm transition">← Back to Site</Link>
        </div>
      </section>

      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-4 text-sm font-semibold whitespace-nowrap border-b-2 transition ${
                activeTab === tab.id ? "border-brand-600 text-brand-700" : "border-transparent text-gray-500 hover:text-brand-600"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">⚠️ {error}</div>}
        {formMessage && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">✅ {formMessage}</div>}
        {formError && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">⚠️ {formError}</div>}

        {/* STATS TAB */}
        {activeTab === "stats" && stats && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {[
                { label: "Total Users", value: stats.totalUsers, icon: "👥" },
                { label: "Total Papers", value: stats.totalPapers, icon: "📄" },
                { label: "Total Questions", value: stats.totalQuestions, icon: "❓" },
                { label: "Active Premium", value: stats.activeSubscriptions, icon: "⭐" },
                { label: "Total Revenue", value: `$${stats.totalRevenue?.toFixed(2)}`, icon: "💰" },
                { label: "Practice Tests", value: stats.totalPracticeTests, icon: "✏️" },
                { label: "Points Awarded", value: stats.totalPointsAwarded?.toLocaleString(), icon: "🏆" },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow p-4 text-center">
                  <div className="text-2xl mb-1">{stat.icon}</div>
                  <p className="text-xl font-bold text-brand-800">{stat.value}</p>
                  <p className="text-xs text-gray-500">{stat.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🆕 Recent Registrations (last 10)</h2>
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                        </td>
                        <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {!analytics ? (
              <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                {/* 30-day summary cards */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[
                    { label: "New Users (30d)", value: analytics.summary.totalNewUsers, icon: "👥", color: "text-blue-600" },
                    { label: "New Subs (30d)", value: analytics.summary.totalNewSubs, icon: "⭐", color: "text-yellow-600" },
                    { label: "Revenue (30d)", value: `$${analytics.summary.totalNewRevenue.toFixed(2)}`, icon: "💰", color: "text-green-600" },
                    { label: "Tests Taken (30d)", value: analytics.summary.totalNewTests, icon: "✏️", color: "text-purple-600" },
                    { label: "Avg Score (30d)", value: `${analytics.summary.avgScore}%`, icon: "🎯", color: "text-brand-600" },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-2xl border border-gray-200 shadow p-5 text-center">
                      <div className="text-2xl mb-1">{s.icon}</div>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>

                {/* Registrations chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">👥 New Registrations — Last 30 Days</h2>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.daily.map((d: any, i: number) => {
                      const max = Math.max(...analytics.daily.map((x: any) => x.registrations), 1);
                      const height = Math.round((d.registrations / max) * 100);
                      const isToday = d.date === new Date().toISOString().split("T")[0];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {d.date}: {d.registrations} users
                          </div>
                          <div
                            className={`w-full rounded-t transition-all ${isToday ? "bg-brand-600" : "bg-brand-200 hover:bg-brand-400"}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{analytics.daily[0]?.date}</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* Revenue chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">💰 Daily Revenue — Last 30 Days</h2>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.daily.map((d: any, i: number) => {
                      const max = Math.max(...analytics.daily.map((x: any) => x.revenue), 1);
                      const height = Math.round((d.revenue / max) * 100);
                      const isToday = d.date === new Date().toISOString().split("T")[0];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {d.date}: ${d.revenue.toFixed(2)}
                          </div>
                          <div
                            className={`w-full rounded-t transition-all ${isToday ? "bg-green-600" : "bg-green-200 hover:bg-green-400"}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{analytics.daily[0]?.date}</span>
                    <span>Today</span>
                  </div>
                </div>

                {/* Practice tests chart */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ Practice Tests — Last 30 Days</h2>
                  <div className="flex items-end gap-1 h-32">
                    {analytics.daily.map((d: any, i: number) => {
                      const max = Math.max(...analytics.daily.map((x: any) => x.tests), 1);
                      const height = Math.round((d.tests / max) * 100);
                      const isToday = d.date === new Date().toISOString().split("T")[0];
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
                          <div className="absolute bottom-full mb-1 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            {d.date}: {d.tests} tests
                          </div>
                          <div
                            className={`w-full rounded-t transition-all ${isToday ? "bg-purple-600" : "bg-purple-200 hover:bg-purple-400"}`}
                            style={{ height: `${Math.max(height, 2)}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-2">
                    <span>{analytics.daily[0]?.date}</span>
                    <span>Today</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Topic popularity */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">🔥 Most Practiced Topics</h2>
                    {analytics.topicStats.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No practice data yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.topicStats.map((t: any, i: number) => {
                          const max = analytics.topicStats[0].count;
                          const pct = Math.round((t.count / max) * 100);
                          return (
                            <div key={t.topicId || i}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700 font-medium">{t.icon} {t.name}</span>
                                <span className="text-gray-500">{t.count} tests</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div className="bg-brand-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Plan breakdown */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4">⭐ Active Subscription Plans</h2>
                    {analytics.planBreakdown.length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-4">No active subscriptions.</p>
                    ) : (
                      <div className="space-y-4">
                        {analytics.planBreakdown.map((p: any) => (
                          <div key={p.plan} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="font-semibold text-gray-800 capitalize">{p.plan.replace("_", " ")}</p>
                              <p className="text-xs text-gray-400">
                                {p.plan === "two_weeks" ? "$3" : p.plan === "annual" ? "$45" : "$5"} per period
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-brand-700">{p._count.plan}</p>
                              <p className="text-xs text-gray-400">subscribers</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* DAILY CHALLENGES TAB */}
        {activeTab === "daily" && (
          <div className="space-y-6">
            {/* Schedule form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">📅 Schedule a Daily Challenge</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input type="date" value={challengeForm.date}
                    onChange={(e) => setChallengeForm({ ...challengeForm, date: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question <span className="text-gray-400 font-normal">({eligibleQuestions.length} eligible)</span>
                  </label>
                  <select value={challengeForm.questionId}
                    onChange={(e) => setChallengeForm({ ...challengeForm, questionId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="">Select a question...</option>
                    {eligibleQuestions.map((q: any) => (
                      <option key={q.id} value={q.id}>
                        [{q.topic?.name}] Q{q.questionNumber} — {q.questionText?.slice(0, 60)}...
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Only questions marked "Daily Challenge Eligible" appear here. Mark questions eligible in the Questions tab.
                  </p>
                </div>
              </div>
              <button onClick={handleScheduleChallenge}
                className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                Schedule Challenge
              </button>
            </div>

            {/* Scheduled challenges list */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                📋 Scheduled Challenges ({dailyChallenges.length})
              </h2>
              {dailyChallenges.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No challenges scheduled yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">Date</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Topic</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Question</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Attempts</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Correct</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Status</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dailyChallenges.map((c: any) => {
                        const challengeDate = new Date(c.date);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isPast = challengeDate < today;
                        const isToday = challengeDate.toDateString() === today.toDateString();
                        return (
                          <tr key={c.id} className="border-b border-gray-50">
                            <td className="py-3 font-medium text-gray-800">
                              {challengeDate.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                            </td>
                            <td className="py-3 text-gray-500">{c.question?.topic?.name}</td>
                            <td className="py-3 text-gray-600 max-w-xs truncate">
                              {c.question?.questionText?.slice(0, 60)}...
                            </td>
                            <td className="py-3 text-gray-500">{c.totalAttempts}</td>
                            <td className="py-3 text-gray-500">{c.correctAttempts}</td>
                            <td className="py-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isToday ? "bg-green-100 text-green-700" :
                                isPast ? "bg-gray-100 text-gray-500" :
                                "bg-blue-100 text-blue-700"
                              }`}>
                                {isToday ? "Today" : isPast ? "Past" : "Upcoming"}
                              </span>
                            </td>
                            <td className="py-3">
                              {!isPast && (
                                <button onClick={() => handleDeleteChallenge(c.id)}
                                  className="text-red-500 hover:text-red-700 text-xs font-semibold">
                                  Delete
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
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
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={paperForm.isFree} onChange={(e) => setPaperForm({ ...paperForm, isFree: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                    Free paper (visible to all users)
                  </label>
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
                      <th className="text-left py-2 text-gray-500 font-medium">Free</th>
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
                          <button onClick={() => handleTogglePaperFree(paper.id, paper.isFree)}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold transition ${paper.isFree ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                            {paper.isFree ? "Free" : "Premium"}
                          </button>
                        </td>
                        <td className="py-3">
                          <button onClick={() => handleDeletePaper(paper.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                        </td>
                      </tr>
                    ))}
                    {papers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No papers yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* QUESTIONS TAB */}
        {activeTab === "questions" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-1">📥 Batch Import Questions</h2>
              <p className="text-sm text-gray-500 mb-4">
                Upload a CSV to add multiple questions at once.{" "}
                <button onClick={downloadTemplate} className="text-brand-600 hover:underline text-sm font-semibold">Download template</button>
              </p>
              <input type="file" accept=".csv" onChange={handleCsvImport}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
              {csvPreview.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Preview — {csvPreview.length} questions ready to import:</p>
                  <div className="max-h-48 overflow-y-auto space-y-1 mb-3">
                    {csvPreview.slice(0, 5).map((q: any, i: number) => (
                      <div key={i} className="text-xs bg-gray-50 rounded px-3 py-2 flex gap-2 items-center">
                        <span className="text-brand-600 font-medium w-24 flex-shrink-0">{q.topicSlug}</span>
                        <span className="text-gray-400 w-6 flex-shrink-0">Q{q.questionNumber}</span>
                        <span className="text-gray-600 truncate flex-1">{q.questionText}</span>
                      </div>
                    ))}
                    {csvPreview.length > 5 && <p className="text-xs text-gray-400 text-center py-1">...and {csvPreview.length - 5} more</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleBatchImport} disabled={importLoading}
                      className="bg-brand-700 hover:bg-brand-600 disabled:bg-brand-300 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                      {importLoading ? "Importing..." : `Import ${csvPreview.length} Questions`}
                    </button>
                    <button onClick={() => { setCsvPreview([]); setImportResult(null); }}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm font-semibold transition">Cancel</button>
                  </div>
                </div>
              )}
              {importResult && (
                <div className={`mt-3 px-4 py-3 rounded-lg text-sm ${importResult.failed > 0 ? "bg-yellow-50 border border-yellow-200 text-yellow-700" : "bg-green-50 border border-green-200 text-green-700"}`}>
                  <p className="font-semibold">✅ {importResult.imported} imported{importResult.failed > 0 ? `, ⚠️ ${importResult.failed} failed` : ""}</p>
                  {importResult.errors?.map((e: string, i: number) => <p key={i} className="text-xs mt-1">{e}</p>)}
                </div>
              )}
            </div>

            {/* Add / Edit Question Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">{editingQuestionId ? "✏️ Edit Question" : "➕ Add New Question"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper <span className="text-gray-400 font-normal text-xs">(optional)</span></label>
                  <select value={questionForm.paperId}
                    onChange={(e) => {
                      setQuestionForm({ ...questionForm, paperId: e.target.value });
                      if (e.target.value) { setSelectedPaperId(e.target.value); fetchQuestions(e.target.value); }
                      else { setSelectedPaperId(""); setQuestions([]); }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="">No paper — Practice question only</option>
                    {papers.map((p: any) => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
                  <select value={questionForm.topicId} onChange={(e) => setQuestionForm({ ...questionForm, topicId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="">Select a topic...</option>
                    {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
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
                  <select value={questionForm.difficulty} onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
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
                    placeholder="e.g. 13 or $x = 3$"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 font-mono" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
                  <textarea value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    placeholder="e.g. Simplify $2\frac{1}{2} \div 3\frac{3}{4}$"
                    rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono" />
                  <LatexCheatSheet />
                </div>
                {questionForm.questionText && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Preview</label>
                    <div className="border border-gray-200 rounded-lg px-4 py-3 bg-gray-50 text-gray-800">
                      <MathContent>{questionForm.questionText}</MathContent>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Question Image <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="file" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true); setFormMessage("Uploading image...");
                      try {
                        const url = await uploadImage(file);
                        setQuestionForm({ ...questionForm, questionImageUrl: url });
                        setFormMessage("Image uploaded successfully!");
                      } catch (err) { setFormError("Image upload failed: " + (err as Error).message); }
                      finally { setUploadingImage(false); }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
                  {uploadingImage && <div className="mt-2 text-xs text-brand-600">Uploading...</div>}
                  {questionForm.questionImageUrl && (
                    <div className="mt-3">
                      <img src={questionForm.questionImageUrl} alt="Question diagram" className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain" />
                      <button onClick={() => setQuestionForm({ ...questionForm, questionImageUrl: "" })} className="mt-2 text-xs text-red-500 hover:text-red-700">Remove image</button>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Solution / Working</label>
                  <textarea value={questionForm.solutionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, solutionText: e.target.value })}
                    placeholder="Enter the full solution with working..."
                    rows={4} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono" />
                </div>
                <div className="flex gap-6 flex-wrap">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={questionForm.isFree} onChange={(e) => setQuestionForm({ ...questionForm, isFree: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                    Free question
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={questionForm.isDailyEligible} onChange={(e) => setQuestionForm({ ...questionForm, isDailyEligible: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                    Daily challenge eligible
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={editingQuestionId ? handleUpdateQuestion : handleAddQuestion}
                  className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                  {editingQuestionId ? "Update Question" : "Add Question"}
                </button>
                {editingQuestionId && (
                  <button onClick={() => {
                    setEditingQuestionId(null);
                    setQuestionForm({ paperId: "", topicId: "", questionNumber: 1, questionText: "", marks: 1, difficulty: "medium", correctAnswer: "", solutionText: "", isFree: false, isDailyEligible: false, questionImageUrl: "" });
                  }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-lg font-semibold text-sm transition">Cancel</button>
                )}
              </div>
            </div>

            {/* Paper Questions */}
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
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{q.marks}m</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{q.topic?.name}</span>
                          {q.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          {q.isDailyEligible && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Daily</span>}
                        </div>
                        <div className="text-sm text-gray-800"><MathContent>{q.questionText || ""}</MathContent></div>
                        {q.correctAnswer && <div className="text-xs text-green-600 mt-1">Answer: <MathContent>{q.correctAnswer}</MathContent></div>}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEditQuestion(q)} className="text-brand-600 hover:text-brand-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice-Only Questions */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">✏️ Practice-Only Questions ({practiceQuestions.length})</h2>
              {practiceQuestions.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No practice-only questions yet.</p>
              ) : (
                <div className="space-y-3">
                  {practiceQuestions.map((q: any) => (
                    <div key={q.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">Q{q.questionNumber}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded capitalize">{q.difficulty}</span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">{q.marks}m</span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{q.topic?.name}</span>
                          {q.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          {q.isDailyEligible && <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded">Daily</span>}
                        </div>
                        <div className="text-sm text-gray-800"><MathContent>{q.questionText || ""}</MathContent></div>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEditQuestion(q)} className="text-brand-600 hover:text-brand-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDeleteQuestion(q.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                      </div>
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
              <h2 className="text-lg font-bold text-gray-800 mb-4">{editingLessonId ? "✏️ Edit Lesson" : "➕ Add New Lesson"}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Topic</label>
                  <select value={lessonForm.topicId}
                    onChange={(e) => { setLessonForm({ ...lessonForm, topicId: e.target.value }); if (e.target.value) fetchLessons(e.target.value); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500">
                    <option value="">Select a topic...</option>
                    {topics.map((t: any) => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lesson Title</label>
                  <input type="text" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                    placeholder="e.g. Introduction to Algebra"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Order</label>
                  <input type="number" value={lessonForm.orderIndex} onChange={(e) => setLessonForm({ ...lessonForm, orderIndex: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Estimated Minutes</label>
                  <input type="number" value={lessonForm.estimatedMinutes} onChange={(e) => setLessonForm({ ...lessonForm, estimatedMinutes: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">YouTube Video URL <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="text" value={lessonForm.videoUrl} onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lesson Image <span className="text-gray-400 font-normal">(optional)</span></label>
                  <input type="file" accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setUploadingImage(true); setFormMessage("Uploading image...");
                      try {
                        const url = await uploadImage(file);
                        setLessonForm({ ...lessonForm, imageUrl: url });
                        setFormMessage("Image uploaded!");
                      } catch (err) { setFormError("Upload failed."); }
                      finally { setUploadingImage(false); }
                    }}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer" />
                  {lessonForm.imageUrl && (
                    <div className="mt-3">
                      <img src={lessonForm.imageUrl} alt="Lesson" className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain" />
                      <button onClick={() => setLessonForm({ ...lessonForm, imageUrl: "" })} className="mt-2 text-xs text-red-500">Remove</button>
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Lesson Content</label>
                  <textarea value={lessonForm.content} onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                    placeholder="Lesson content. Supports LaTeX math: $\frac{n}{2}$ and Markdown."
                    rows={8} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none font-mono" />
                  <LatexCheatSheet />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" checked={lessonForm.isFree} onChange={(e) => setLessonForm({ ...lessonForm, isFree: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                    Free lesson
                  </label>
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button onClick={editingLessonId ? handleUpdateLesson : handleAddLesson}
                  className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition">
                  {editingLessonId ? "Update Lesson" : "Add Lesson"}
                </button>
                {editingLessonId && (
                  <button onClick={() => {
                    setEditingLessonId(null);
                    setLessonForm({ topicId: "", title: "", content: "", orderIndex: 1, isFree: false, estimatedMinutes: 10, videoUrl: "", geogebraUrl: "", imageUrl: "" });
                  }} className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-6 py-2 rounded-lg font-semibold text-sm transition">Cancel</button>
                )}
              </div>
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
                          {lesson.imageUrl && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">🖼️ Image</span>}
                          {lesson.isFree && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>}
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">{lesson.topic?.name}</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-800">{lesson.title}</p>
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button onClick={() => handleEditLesson(lesson)} className="text-brand-600 hover:text-brand-800 text-xs font-semibold">Edit</button>
                        <button onClick={() => handleDeleteLesson(lesson.id)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Delete</button>
                      </div>
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
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold text-gray-800">👥 All Users ({users.length})</h2>
              <input type="text" value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); fetchUsers(e.target.value, 0); }}
                placeholder="Search by name or email..."
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 w-64" />
            </div>
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>{u.role}</span>
                      </td>
                      <td className="py-3">
                        {u.subscription?.status === "active" ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">⭐ {u.subscription.plan}</span>
                        ) : (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">{new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
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
                  {users.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No users found</td></tr>}
                </tbody>
              </table>
            </div>
            {/* Pagination */}
            {userTotalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                <p className="text-sm text-gray-500">
                  Showing {userPage * 50 + 1}–{Math.min((userPage + 1) * 50, userTotal)} of {userTotal} users
                </p>
                <div className="flex gap-2">
                  <button onClick={() => fetchUsers(userSearch, userPage - 1)} disabled={userPage === 0}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Previous
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-600">Page {userPage + 1} of {userTotalPages}</span>
                  <button onClick={() => fetchUsers(userSearch, userPage + 1)} disabled={userPage >= userTotalPages - 1}
                    className="px-3 py-1 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
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
                    <th className="text-left py-2 text-gray-500 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscriptions.map((s: any) => (
                    <tr key={s.id} className="border-b border-gray-50">
                      <td className="py-3 font-medium text-gray-800">{s.user?.name}</td>
                      <td className="py-3 text-gray-500">{s.user?.email}</td>
                      <td className="py-3 text-gray-500 capitalize">{s.plan?.replace("_", " ")}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${s.status === "active" ? "bg-green-100 text-green-700" : s.status === "pending" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{s.status}</span>
                      </td>
                      <td className="py-3 text-gray-500">${s.amountUsd}</td>
                      <td className="py-3 text-gray-500">{new Date(s.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                      <td className="py-3">
                        {s.status === "active" && (
                          <button onClick={() => handleCancelSubscription(s.userId)} className="text-red-500 hover:text-red-700 text-xs font-semibold">Cancel</button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No subscriptions yet</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* BADGES TAB */}
        {activeTab === "badges" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🏅 Badge Statistics</h2>
              {badgeStats.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No badges earned yet.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {badgeStats.map((b: any) => (
                    <div key={b.badgeSlug} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-200">
                      <p className="font-bold text-gray-800 text-sm">{b.badgeSlug.replace(/-/g, ' ')}</p>
                      <p className="text-2xl font-bold text-brand-700 mt-1">{b._count.badgeSlug}</p>
                      <p className="text-xs text-gray-400">students earned</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">🕐 Recent Badges Awarded</h2>
              {recentBadges.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-6">No badges awarded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left py-2 text-gray-500 font-medium">Student</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Email</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Badge</th>
                        <th className="text-left py-2 text-gray-500 font-medium">Awarded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBadges.map((b: any) => (
                        <tr key={b.id} className="border-b border-gray-50">
                          <td className="py-3 font-medium text-gray-800">{b.user?.name}</td>
                          <td className="py-3 text-gray-500">{b.user?.email}</td>
                          <td className="py-3">
                            <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-semibold capitalize">
                              {b.badgeSlug.replace(/-/g, ' ')}
                            </span>
                          </td>
                          <td className="py-3 text-gray-500">{new Date(b.awardedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
