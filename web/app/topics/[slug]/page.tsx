"use client";
import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function TopicPage() {
  const { token, loading: authLoading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [topic, setTopic] = useState<any>(null);
  const [lessons, setLessons] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"lessons" | "practice">("lessons");

  useEffect(() => {
    if (slug) fetchTopicData();
  }, [slug]);

  const fetchTopicData = async () => {
    setLoading(true);
    try {
      // Fetch topic info
      const topicRes = await fetch(`http://localhost:5000/api/topics/${slug}`);
      const topicData = await topicRes.json();

      if (!topicData.success) {
        setError("Topic not found.");
        return;
      }

      setTopic(topicData.data);

      // Fetch lessons for this topic
      const lessonsRes = await fetch(`http://localhost:5000/api/topics/${slug}/lessons`);
      const lessonsData = await lessonsRes.json();
      if (lessonsData.success) {
        setLessons(lessonsData.data);
        if (lessonsData.data.length > 0) {
          setActiveLesson(lessonsData.data[0]);
        }
      }

      // Fetch practice questions for this topic
      const questionsRes = await fetch(
        `http://localhost:5000/api/questions?topic=${slug}&count=5`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );
      const questionsData = await questionsRes.json();
      if (questionsData.success) setQuestions(questionsData.data);

    } catch (err) {
      setError("Failed to load topic.");
    } finally {
      setLoading(false);
    }
  };

  const getYouTubeId = (url: string) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? match[1] : null;
  };

  const tierBadge = (tier: number) => {
    if (tier === 1) return <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Always Examined</span>;
    if (tier === 2) return <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-3 py-1 rounded-full">Frequently Examined</span>;
    return <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full">Regularly Examined</span>;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Loading topic...</p>
        </div>
      </main>
    );
  }

  if (error || !topic) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-4xl mb-4">😕</p>
          <p className="text-gray-600 font-semibold mb-4">{error || "Topic not found"}</p>
          <Link href="/topics" className="bg-brand-700 text-white px-6 py-2 rounded-lg font-semibold">
            Back to Topics
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 text-brand-300 text-sm mb-4">
            <Link href="/topics" className="hover:text-white transition">Topics</Link>
            <span>›</span>
            <span>{topic.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-5xl">{topic.icon}</span>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold">{topic.name}</h1>
                {tierBadge(topic.tier)}
              </div>
              <p className="text-brand-200">{topic.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-5xl mx-auto flex gap-1">
          {[
            { id: "lessons", label: "📚 Lessons" },
            { id: "practice", label: "✏️ Practice Questions" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-4 text-sm font-semibold border-b-2 transition ${
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

      <div className="max-w-5xl mx-auto px-6 py-8">

        {/* LESSONS TAB */}
        {activeTab === "lessons" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Lesson List */}
            <div className="md:col-span-1">
              <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-3">
                Lessons
              </h2>
              {lessons.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center">
                  <p className="text-4xl mb-3">📝</p>
                  <p className="text-gray-500 text-sm font-semibold">
                    Lessons coming soon
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Content is being added for this topic
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {lessons.map((lesson: any, index: number) => (
                    <button
                      key={lesson.id}
                      onClick={() => setActiveLesson(lesson)}
                      className={`w-full text-left p-4 rounded-xl border transition ${
                        activeLesson?.id === lesson.id
                          ? "bg-brand-50 border-brand-300"
                          : "bg-white border-gray-200 hover:border-brand-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          activeLesson?.id === lesson.id
                            ? "bg-brand-700 text-white"
                            : "bg-gray-100 text-gray-600"
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">
                            {lesson.title}
                          </p>
                          <p className="text-xs text-gray-400">
                            {lesson.estimatedMinutes} min
                            {lesson.videoUrl && " · 🎥 Video"}
                            {lesson.isFree && " · Free"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Syllabus Points */}
              {topic.syllabusPoints && (
                <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-5">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">📋 Syllabus Points</h3>
                  <ul className="space-y-1">
                    {(Array.isArray(topic.syllabusPoints)
                      ? topic.syllabusPoints
                      : Object.values(topic.syllabusPoints)
                    ).map((point: any, i: number) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-brand-500 mt-0.5">•</span>
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Lesson Content */}
            <div className="md:col-span-2">
              {activeLesson ? (
                <div className="space-y-6">

                  {/* Video Player */}
                  {activeLesson.videoUrl && getYouTubeId(activeLesson.videoUrl) && (
                    <div className="bg-black rounded-2xl overflow-hidden aspect-video">
                      <iframe
                        src={`https://www.youtube.com/embed/${getYouTubeId(activeLesson.videoUrl)}`}
                        title={activeLesson.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  )}

                  {/* Lesson Content */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        {activeLesson.title}
                      </h2>
                      <span className="text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full">
                        {activeLesson.estimatedMinutes} min read
                      </span>
                    </div>
                    <div
                      className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: activeLesson.content }}
                    />
                  </div>

                  {/* Next Lesson */}
                  {lessons.indexOf(activeLesson) < lessons.length - 1 && (
                    <button
                      onClick={() => setActiveLesson(lessons[lessons.indexOf(activeLesson) + 1])}
                      className="w-full bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-xl font-bold transition"
                    >
                      Next Lesson →
                    </button>
                  )}

                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                  <p className="text-4xl mb-3">📚</p>
                  <p className="text-gray-600 font-semibold">Select a lesson to start learning</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* PRACTICE TAB */}
        {activeTab === "practice" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-800">
                Practice Questions — {topic.name}
              </h2>
              <Link
                href={`/practice?topic=${slug}`}
                className="bg-brand-700 hover:bg-brand-600 text-white px-5 py-2 rounded-lg font-semibold text-sm transition"
              >
                Start Full Practice Test
              </Link>
            </div>

            {questions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                <p className="text-4xl mb-3">❓</p>
                <p className="text-gray-600 font-semibold">No questions yet for this topic</p>
                <p className="text-gray-400 text-sm mt-1">Questions are being added</p>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((q: any, index: number) => (
                  <div key={q.id} className="bg-white rounded-2xl border border-gray-200 shadow p-6">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded font-medium">
                        Q{index + 1}
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
                    </div>
                    <p className="text-gray-800">{q.questionText}</p>
                    {q.questionImageUrl && (
                      <img
                        src={q.questionImageUrl}
                        alt="Question diagram"
                        className="mt-3 max-w-full max-h-64 rounded-lg border border-gray-200 object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </main>
  );
}