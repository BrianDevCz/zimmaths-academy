"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function PapersPage() {
  const { token, loading: authLoading } = useAuth();
  const [papers, setPapers] = useState<any[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [paperFilter, setPaperFilter] = useState("all");

  useEffect(() => {
    if (authLoading) return;

    const fetchData = async () => {
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const [papersRes, subRes] = await Promise.all([
          fetch(
            `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/papers`,
            { headers }
          ),
          token
            ? fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/subscriptions/status`,
                { headers }
              )
            : Promise.resolve(null),
        ]);

        const papersData = await papersRes.json();
        if (papersData.success) setPapers(papersData.data || []);

        if (subRes) {
          const subData = await subRes.json();
          if (subData.success && subData.isPremium) setIsPremium(true);
        }
      } catch (err) {
        console.error("Failed to load papers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, authLoading]);

  const filtered = papers.filter((p) => {
    if (yearFilter !== "all" && String(p.year) !== yearFilter) return false;
    if (sessionFilter !== "all" && p.session?.toLowerCase() !== sessionFilter) return false;
    if (paperFilter !== "all" && String(p.paperNumber) !== paperFilter) return false;
    return true;
  });

  const years = [...new Set(papers.map((p) => String(p.year)))].sort().reverse();
  const sessions = [...new Set(papers.map((p) => p.session?.toLowerCase()).filter(Boolean))];

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-12 px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">ZimMaths Practice Papers</h1>
          <p className="text-brand-200 text-lg">Original O-Level Mathematics papers with step-by-step solutions</p>
        </section>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading papers...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">ZimMaths Practice Papers</h1>
        <p className="text-brand-200 text-lg">
          Original O-Level Mathematics papers with step-by-step solutions
        </p>
      </section>

      <section className="bg-white px-6 py-4 shadow-sm flex gap-4 flex-wrap">
        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
        >
          <option value="all">All Years</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
        >
          <option value="all">All Sessions</option>
          {sessions.map((s) => (
            <option key={s} value={s} className="capitalize">{s}</option>
          ))}
        </select>
        <select
          value={paperFilter}
          onChange={(e) => setPaperFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700"
        >
          <option value="all">All Papers</option>
          <option value="1">Paper 1</option>
          <option value="2">Paper 2</option>
        </select>
      </section>

      <section className="px-6 py-10 max-w-6xl mx-auto">
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No papers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((paper: any) => {
              const canAccess = paper.isFree || isPremium;
              return (
                <div
                  key={paper.id}
                  className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800 capitalize">
                        {paper.session} {paper.year}
                      </h3>
                      <p className="text-gray-500">Paper {paper.paperNumber}</p>
                    </div>
                    {paper.isFree ? (
                      <span className="bg-brand-100 text-brand-800 text-sm font-semibold px-3 py-1 rounded-full">
                        FREE
                      </span>
                    ) : (
                      <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">
                        PREMIUM
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 mb-4 flex-wrap">
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {paper.questionCount} Questions
                    </span>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                      {paper.totalMarks} Marks
                    </span>
                    <span className={
                      "text-xs px-2 py-1 rounded capitalize " +
                      (paper.difficultyOverall === "easy"
                        ? "bg-green-100 text-green-700"
                        : paper.difficultyOverall === "hard"
                        ? "bg-red-100 text-red-700"
                        : "bg-yellow-100 text-yellow-700")
                    }>
                      {paper.difficultyOverall}
                    </span>
                  </div>

                  {canAccess ? (
                    <a
                      href={`/papers/${paper.id}`}
                      className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition"
                    >
                      View Paper
                    </a>
                  ) : token ? (
                    <a
                      href="/upgrade"
                      className="block text-center bg-gray-100 hover:bg-yellow-50 border border-gray-200 hover:border-yellow-300 text-gray-600 py-3 rounded-lg font-semibold transition"
                    >
                      🔒 Unlock — Upgrade for $3
                    </a>
                  ) : (
                    <a
                      href="/login"
                      className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-semibold transition"
                    >
                      🔒 Sign in to unlock
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

    </main>
  );
}
