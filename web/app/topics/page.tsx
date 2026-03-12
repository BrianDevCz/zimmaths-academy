export default function TopicsPage() {
  const topics = [
    { number: 1,  name: "General Arithmetic",          lessons: 12, icon: "🔢", tier: 1 },
    { number: 2,  name: "Number Bases",                lessons: 5,  icon: "💻", tier: 3 },
    { number: 3,  name: "Algebra",                     lessons: 16, icon: "📐", tier: 1 },
    { number: 4,  name: "Sets",                        lessons: 6,  icon: "⭕", tier: 3 },
    { number: 5,  name: "Geometry",                    lessons: 12, icon: "📏", tier: 2 },
    { number: 6,  name: "Trigonometry",                lessons: 10, icon: "📐", tier: 1 },
    { number: 7,  name: "Mensuration",                 lessons: 10, icon: "📦", tier: 2 },
    { number: 8,  name: "Graphs & Variation",          lessons: 12, icon: "📈", tier: 1 },
    { number: 9,  name: "Statistics",                  lessons: 12, icon: "📊", tier: 1 },
    { number: 10, name: "Probability",                 lessons: 8,  icon: "🎲", tier: 1 },
    { number: 11, name: "Matrices & Transformations",  lessons: 10, icon: "🔄", tier: 2 },
    { number: 12, name: "Vectors",                     lessons: 8,  icon: "➡️", tier: 2 },
    { number: 13, name: "Coordinate Geometry",         lessons: 8,  icon: "📍", tier: 2 },
    { number: 14, name: "Financial Mathematics",       lessons: 8,  icon: "💰", tier: 3 },
    { number: 15, name: "Measurement & Estimation",    lessons: 4,  icon: "📏", tier: 3 },
  ];

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Page Title */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">All Topics</h1>
        <p className="text-brand-200 text-lg">15 ZIMSEC O-Level Mathematics Topics — Fully Covered</p>
      </section>

      {/* Topics Grid */}
      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <div key={topic.number} className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-4xl">{topic.icon}</span>
                <div>
                  <p className="text-xs text-gray-400 font-semibold">TOPIC {topic.number}</p>
                  <h3 className="text-lg font-bold text-gray-800">{topic.name}</h3>
                </div>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm text-gray-500">{topic.lessons} lessons</span>
                {topic.tier === 1 && (
                  <span className="bg-red-100 text-red-700 text-xs font-semibold px-2 py-1 rounded-full">Always Examined</span>
                )}
                {topic.tier === 2 && (
                  <span className="bg-yellow-100 text-yellow-700 text-xs font-semibold px-2 py-1 rounded-full">Frequently Examined</span>
                )}
                {topic.tier === 3 && (
                  <span className="bg-brand-100 text-brand-700 text-xs font-semibold px-2 py-1 rounded-full">Regularly Examined</span>
                )}
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 mb-4">
                <div className="bg-brand-500 h-2 rounded-full w-0"></div>
              </div>
              <a href="#" className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
                Start Topic
              </a>
            </div>
          ))}
        </div>
      </section>

    </main>
  );
}