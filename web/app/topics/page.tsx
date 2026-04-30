"use client";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "@/app/lib/api";

export default function TopicsPage() {
  const { token, loading: authLoading } = useAuth();
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    const fetchTopics = async () => {
      try {
        const headers: any = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const res = await fetch(`${API_URL}/api/topics`, { headers, cache: 'no-store' });
        const data = await res.json();
        if (data.success) setTopics(data.data || []);
      } catch (error) {
        console.error("Failed to load topics:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTopics();
  }, [token, authLoading]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <section className="bg-brand-800 text-white py-12 px-6 text-center">
          <h1 className="text-4xl font-bold mb-3">All Topics</h1>
          <p className="text-brand-200 text-lg">15 ZIMSEC O-Level Mathematics Topics — Fully Covered</p>
        </section>
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Loading topics...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">All Topics</h1>
        <p className="text-brand-200 text-lg">15 ZIMSEC O-Level Mathematics Topics — Fully Covered</p>
      </section>

      <section className="px-6 py-10 max-w-6xl mx-auto">
        {topics.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No topics found for your syllabus.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
            {topics.map((topic: any) => (
              <div 
                key={topic.id} 
                className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition flex flex-col h-full"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">{topic.icon}</span>
                    <div>
                      <p className="text-xs text-gray-400 font-semibold">TOPIC {topic.orderIndex}</p>
                      <h3 className="text-lg font-bold text-gray-800">{topic.name}</h3>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-2">{topic.description}</p>
                  <div className="flex gap-2 mb-4 flex-wrap">
                    {topic.tier === 1 && (
                      <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">Always Examined</span>
                    )}
                    {topic.tier === 2 && (
                      <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">Frequently Examined</span>
                    )}
                    {topic.tier === 3 && (
                      <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-1 rounded-full">Regularly Examined</span>
                    )}
                    {topic.syllabus && (
                      <span className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded-full">
                        Syllabus {topic.syllabus === "BOTH" ? "A & B" : topic.syllabus}
                      </span>
                    )}
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-brand-500 h-2 rounded-full w-0"></div>
                  </div>
                </div>
                
                <a 
                  href={`/topics/${topic.slug}`}
                  className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition w-full mt-4"
                >
                  Start Topic →
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}