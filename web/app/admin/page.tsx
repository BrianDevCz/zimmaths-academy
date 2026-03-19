"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import * as LR from "@uploadcare/react-uploader";
import "@uploadcare/react-uploader/core.css";

export default function AdminPage() {
  const { token, user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("stats");
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  const [formMessage, setFormMessage] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (token) {
      fetchStats();
      fetchTopics();
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    if (activeTab === "users") fetchUsers();
    if (activeTab === "papers") fetchPapers();
    if (activeTab === "questions") fetchPapers();
    if (activeTab === "subscriptions") fetchSubscriptions();
  }, [activeTab, token]);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/admin/stats", { headers });
      const data = await res.json();
      if (data.success) setStats(data.data);
      else setError(data.error);
    } catch { setError("Cannot connect to server."); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users", { headers });
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch { setError("Failed to load users."); }
  };

  const fetchPapers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/papers", { headers });
      const data = await res.json();
      if (data.success) setPapers(data.data);
    } catch { setError("Failed to load papers."); }
  };

  const fetchQuestions = async (paperId: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/questions?paperId=${paperId}`, { headers });
      const data = await res.json();
      if (data.success) setQuestions(data.data);
    } catch { setError("Failed to load questions."); }
  };

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/subscriptions", { headers });
      const data = await res.json();
      if (data.success) setSubscriptions(data.data);
    } catch { setError("Failed to load subscriptions."); }
  };

  const fetchTopics = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/topics", { headers });
      const data = await res.json();
      if (data.success) setTopics(data.data);
    } catch {}
  };

  const handleAddPaper = async () => {
    setFormError("");
    setFormMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/papers", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
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
      } else {
        setFormError(data.error);
      }
    } catch { setFormError("Failed to add paper."); }
  };

  const handleAddQuestion = async () => {
    setFormError("");
    setFormMessage("");
    try {
      const res = await fetch("http://localhost:5000/api/admin/questions", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...questionForm,
          questionNumber: parseInt(String(questionForm.questionNumber)),
          marks: parseInt(String(questionForm.marks)),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Question added successfully!");
        if (questionForm.paperId) fetchQuestions(questionForm.paperId);
        setQuestionForm((prev) => ({
          ...prev,
          questionNumber: prev.questionNumber + 1,
          questionText: "",
          correctAnswer: "",
          solutionText: "",
          questionImageUrl: "",
        }));
      } else {
        setFormError(data.error);
      }
    } catch { setFormError("Failed to add question."); }
  };

  const handleDeletePaper = async (id: string) => {
    if (!confirm("Delete this paper and all its questions?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/papers/${id}`, { method: "DELETE", headers });
      fetchPapers();
    } catch { setError("Failed to delete paper."); }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!confirm("Delete this question?")) return;
    try {
      await fetch(`http://localhost:5000/api/admin/questions/${id}`, { method: "DELETE", headers });
      if (questionForm.paperId) fetchQuestions(questionForm.paperId);
    } catch { setError("Failed to delete question."); }
  };

  const handleActivateSubscription = async (userId: string, plan: string) => {
    try {
      const res = await fetch(`http://localhost:5000/api/admin/subscriptions/${userId}/activate`, {
        method: "PUT",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.success) {
        setFormMessage("Subscription activated!");
        fetchSubscriptions();
        fetchUsers();
      }
    } catch { setError("Failed to activate subscription."); }
  };

  const tabs = [
    { id: "stats", label: "📊 Dashboard" },
    { id: "papers", label: "📄 Papers" },
    { id: "questions", label: "❓ Questions" },
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
          <a href="/" className="text-brand-300 hover:text-white text-sm transition">
            ← Back to Site
          </a>
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

        {/* Global Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* Form Messages */}
        {formMessage && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ✅ {formMessage}
          </div>
        )}
        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            ⚠️ {formError}
          </div>
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

            {/* Recent Users */}
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
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500">
                          {new Date(u.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
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

            {/* Add Paper Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Add New Paper</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={paperForm.title}
                    onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                    placeholder="e.g. ZIMSEC O-Level Maths November 2023 Paper 1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={paperForm.year}
                    onChange={(e) => setPaperForm({ ...paperForm, year: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Session</label>
                  <select
                    value={paperForm.session}
                    onChange={(e) => setPaperForm({ ...paperForm, session: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="june">June</option>
                    <option value="november">November</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper Number</label>
                  <select
                    value={paperForm.paperNumber}
                    onChange={(e) => setPaperForm({ ...paperForm, paperNumber: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value={1}>Paper 1</option>
                    <option value={2}>Paper 2</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleAddPaper}
                className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
              >
                Add Paper
              </button>
            </div>

            {/* Papers List */}
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
                          <button
                            onClick={() => handleDeletePaper(paper.id)}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                    {papers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-gray-400">No papers yet</td>
                      </tr>
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

            {/* Add Question Form */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-4">➕ Add New Question</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Paper</label>
                  <select
                    value={questionForm.paperId}
                    onChange={(e) => {
                      setQuestionForm({ ...questionForm, paperId: e.target.value });
                      if (e.target.value) fetchQuestions(e.target.value);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="">Select a paper...</option>
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
                  <input
                    type="number"
                    value={questionForm.questionNumber}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionNumber: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Marks</label>
                  <input
                    type="number"
                    value={questionForm.marks}
                    onChange={(e) => setQuestionForm({ ...questionForm, marks: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Difficulty</label>
                  <select
                    value={questionForm.difficulty}
                    onChange={(e) => setQuestionForm({ ...questionForm, difficulty: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Correct Answer</label>
                  <input
                    type="text"
                    value={questionForm.correctAnswer}
                    onChange={(e) => setQuestionForm({ ...questionForm, correctAnswer: e.target.value })}
                    placeholder="e.g. 42 or x = 3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Question Text</label>
                  <textarea
                    value={questionForm.questionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, questionText: e.target.value })}
                    placeholder="Enter the full question text..."
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                {/* Image Upload */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">
                    Question Diagram / Image{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <LR.FileUploaderRegular
                    pubkey={process.env.NEXT_PUBLIC_UPLOADCARE_PUBLIC_KEY || ""}
                    imgOnly={true}
                    multiple={false}
                    onFileUploadSuccess={(file: any) => {
                      setQuestionForm({ ...questionForm, questionImageUrl: file.cdnUrl });
                      setFormMessage("Image uploaded successfully!");
                    }}
                    onFileUploadFailed={() => setFormError("Image upload failed. Please try again.")}
                  />
                  {questionForm.questionImageUrl && (
                    <div className="mt-3">
                      <p className="text-xs text-green-600 mb-2">✅ Image uploaded</p>
                      <img
                        src={questionForm.questionImageUrl}
                        alt="Question diagram"
                        className="max-w-full max-h-64 rounded-lg border border-gray-200 object-contain"
                      />
                      <button
                        onClick={() => setQuestionForm({ ...questionForm, questionImageUrl: "" })}
                        className="mt-2 text-xs text-red-500 hover:text-red-700"
                      >
                        Remove image
                      </button>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Solution / Working</label>
                  <textarea
                    value={questionForm.solutionText}
                    onChange={(e) => setQuestionForm({ ...questionForm, solutionText: e.target.value })}
                    placeholder="Enter the full solution with working..."
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-500 resize-none"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionForm.isFree}
                      onChange={(e) => setQuestionForm({ ...questionForm, isFree: e.target.checked })}
                      className="w-4 h-4 accent-brand-600"
                    />
                    Free question
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={questionForm.isDailyEligible}
                      onChange={(e) => setQuestionForm({ ...questionForm, isDailyEligible: e.target.checked })}
                      className="w-4 h-4 accent-brand-600"
                    />
                    Daily challenge eligible
                  </label>
                </div>

              </div>

              <button
                onClick={handleAddQuestion}
                className="mt-4 bg-brand-700 hover:bg-brand-600 text-white px-6 py-2 rounded-lg font-semibold text-sm transition"
              >
                Add Question
              </button>
            </div>

            {/* Questions List */}
            {questions.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">
                  ❓ Questions ({questions.length})
                </h2>
                <div className="space-y-3">
                  {questions.map((q: any) => (
                    <div key={q.id} className="flex items-start justify-between gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-2 mb-1 flex-wrap">
                          <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">
                            Q{q.questionNumber}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded capitalize">
                            {q.difficulty}
                          </span>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                            {q.marks} marks
                          </span>
                          {q.isFree && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">Free</span>
                          )}
                          {q.questionImageUrl && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">📷 Has image</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-800 line-clamp-2">{q.questionText}</p>
                        {q.questionImageUrl && (
                          <img
                            src={q.questionImageUrl}
                            alt="Question diagram"
                            className="mt-2 max-w-xs max-h-32 rounded-lg border border-gray-200 object-contain"
                          />
                        )}
                        {q.correctAnswer && (
                          <p className="text-xs text-green-600 mt-1">Answer: {q.correctAnswer}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="text-red-500 hover:text-red-700 text-xs font-semibold flex-shrink-0"
                      >
                        Delete
                      </button>
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
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          u.role === "admin" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3">
                        {u.subscription?.status === "active" ? (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                            ⭐ {u.subscription.plan}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Free</span>
                        )}
                      </td>
                      <td className="py-3 text-gray-500">
                        {new Date(u.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <select
                          onChange={(e) => {
                            if (e.target.value) handleActivateSubscription(u.id, e.target.value);
                            e.target.value = "";
                          }}
                          className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600"
                          defaultValue=""
                        >
                          <option value="">Activate...</option>
                          <option value="two_weeks">2 Weeks</option>
                          <option value="monthly">Monthly</option>
                          <option value="annual">Annual</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">No users yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBSCRIPTIONS TAB */}
        {activeTab === "subscriptions" && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">
              💳 All Subscriptions ({subscriptions.length})
            </h2>
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
                        }`}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 text-gray-500">${s.amountUsd}</td>
                      <td className="py-3 text-gray-500">
                        {new Date(s.expiresAt).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                      </td>
                      <td className="py-3 text-gray-400 text-xs font-mono">{s.paymentReference}</td>
                    </tr>
                  ))}
                  {subscriptions.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400">No subscriptions yet</td>
                    </tr>
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