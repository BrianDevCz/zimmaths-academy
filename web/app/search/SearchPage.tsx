"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import MathContent from "../components/MathContent";
import { API_URL } from "@/app/lib/api";
import Link from "next/link";

const TOPICS = [
  { slug: "all", name: "All Topics" },
  { slug: "general-arithmetic", name: "General Arithmetic" },
  { slug: "number-bases", name: "Number Bases" },
  { slug: "algebra", name: "Algebra" },
  { slug: "sets", name: "Sets" },
  { slug: "geometry", name: "Geometry" },
  { slug: "trigonometry", name: "Trigonometry" },
  { slug: "mensuration", name: "Mensuration" },
  { slug: "graphs-variation", name: "Graphs & Variation" },
  { slug: "statistics", name: "Statistics" },
  { slug: "probability", name: "Probability" },
  { slug: "matrices-transformations", name: "Matrices & Transformations" },
  { slug: "vectors", name: "Vectors" },
  { slug: "coordinate-geometry", name: "Coordinate Geometry" },
  { slug: "financial-mathematics", name: "Financial Mathematics" },
  { slug: "measurement-estimation", name: "Measurement & Estimation" },
];

const SUGGESTIONS = ["quadratic", "sine rule", "probability", "vectors", "compound interest", "matrices"];

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isPremium } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [topic, setTopic] = useState(searchParams.get("topic") || "all");
  const [difficulty, setDifficulty] = useState(searchParams.get("difficulty") || "all");
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Search on mount if query in URL
  useEffect(() => {
    const q = searchParams.get("q");
    if (q) searchByTerm(q, 0, searchParams.get("topic") || "all", searchParams.get("difficulty") || "all");
    inputRef.current?.focus();
  }, []);

  // Core search function — takes term directly to avoid state timing issues
  const searchByTerm = async (term: string, pageNum = 0, topicFilter = topic, difficultyFilter = difficulty) => {
    if (!term.trim() || term.trim().length < 2) {
      setError("Please enter at least 2 characters to search.");
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("q", term.trim());
      params.set("page", String(pageNum));
      if (topicFilter !== "all") params.set("topic", topicFilter);
      if (difficultyFilter !== "all") params.set("difficulty", difficultyFilter);

      // Update URL
      router.replace(`/search?${params.toString()}`, { scroll: false });

      const res = await fetch(`${API_URL}/api/questions/search?${params}`);
      const data = await res.json();

      if (data.success) {
        setResults(data.data);
        setTotal(data.total);
        setTotalPages(data.totalPages);
        setPage(pageNum);
      } else {
        setError(data.error || "Search failed.");
        setResults([]);
      }
    } catch {
      setError("Search failed. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Wrapper for search bar — reads from state
  const handleSearch = (pageNum = 0) => searchByTerm(query, pageNum, topic, difficulty);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch(0);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">🔍 Search Questions</h1>
          <p className="text-brand-200 mb-6">Search across all ZIMSEC past paper questions</p>

          {/* Search bar */}
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. quadratic equation, probability tree, sine rule..."
              className="flex-1 px-4 py-3 rounded-xl text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
            />
            <button
              onClick={() => handleSearch(0)}
              disabled={loading}
              className="bg-brand-500 hover:bg-brand-400 disabled:bg-brand-300 text-white px-6 py-3 rounded-xl font-bold transition"
            >
              {loading ? "..." : "Search"}
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-3 mt-3 flex-wrap">
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="bg-brand-700 text-white text-sm px-3 py-2 rounded-lg border border-brand-600 focus:outline-none"
            >
              {TOPICS.map((t) => (
                <option key={t.slug} value={t.slug}>{t.name}</option>
              ))}
            </select>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="bg-brand-700 text-white text-sm px-3 py-2 rounded-lg border border-brand-600 focus:outline-none"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-8">
        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Results count */}
        {searched && !loading && !error && (
          <p className="text-gray-500 text-sm mb-4">
            {total === 0
              ? `No results for "${query}"`
              : `${total} result${total !== 1 ? "s" : ""} for "${query}"`}
          </p>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* No results */}
        {searched && !loading && total === 0 && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">No questions found</h2>
            <p className="text-gray-500 mb-4">Try different keywords or remove filters.</p>
            <div className="text-sm text-gray-400 space-y-1 text-left max-w-xs mx-auto">
              <p className="font-medium text-gray-500 mb-2">Tips:</p>
              <p>• Use simpler keywords — "factorise" not "factorisation"</p>
              <p>• Try a topic name — "trigonometry" or "probability"</p>
              <p>• Search for a concept — "sine rule" or "compound interest"</p>
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div className="space-y-4">
            {results.map((q: any) => (
              <div key={q.id} className="bg-white rounded-2xl shadow p-6 border border-gray-200">
                <div className="flex gap-2 mb-3 flex-wrap">
                  <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">
                    {q.topic?.icon} {q.topic?.name}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${
                    q.difficulty === "easy" ? "bg-green-100 text-green-700" :
                    q.difficulty === "hard" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {q.difficulty}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {q.marks} marks
                  </span>
                  {q.paper && (
                    <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
                      {q.paper.title}
                    </span>
                  )}
                  {q.isFree && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-medium">Free</span>
                  )}
                </div>

                <div className="text-gray-800 leading-relaxed mb-4">
                  <MathContent>{q.questionText || ""}</MathContent>
                </div>

                {q.questionImageUrl && (
                  <img src={q.questionImageUrl} alt="diagram"
                    className="max-w-full max-h-48 rounded-lg border border-gray-200 object-contain mb-4" />
                )}

                <div className="flex gap-3 flex-wrap">
                  {q.paperId && (
                    <Link href={`/papers/${q.paperId}/questions/${q.id}`}
                      className="bg-brand-700 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">
                      View Solution
                    </Link>
                  )}
                  <Link href={`/topics/${q.topic?.slug}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                    {q.topic?.icon} Study Topic
                  </Link>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-gray-500">
                  Page {page + 1} of {totalPages} ({total} results)
                </p>
                <div className="flex gap-2">
                  <button onClick={() => handleSearch(page - 1)} disabled={page === 0}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    ← Previous
                  </button>
                  <button onClick={() => handleSearch(page + 1)} disabled={page >= totalPages - 1}
                    className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition">
                    Next →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state — not yet searched */}
        {!searched && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
            <div className="text-5xl mb-4">📚</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Search ZIMSEC Questions</h2>
            <p className="text-gray-500 mb-6">Find questions by topic, concept or keyword</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
              {SUGGESTIONS.map((term) => (
                <button
                  key={term}
                  onClick={() => { setQuery(term); searchByTerm(term, 0, topic, difficulty); }}
                  className="bg-brand-50 hover:bg-brand-100 text-brand-700 px-3 py-2 rounded-lg text-sm font-medium transition"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
