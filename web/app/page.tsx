"use client";
import { useState, useEffect } from "react";

function TypewriterText() {
  const phrases = [
    "Practice papers explained step by step.",
    "AI tutor available 24/7.",
    "Daily challenges to keep you sharp.",
    "All 15 ZIMSEC topics covered.",
    "For less than the price of a textbook.",
  ];

  const [currentPhrase, setCurrentPhrase] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const phrase = phrases[currentPhrase];
    let timer: ReturnType<typeof setTimeout>;

    if (!isDeleting && currentText.length < phrase.length) {
      timer = setTimeout(() => setCurrentText(phrase.slice(0, currentText.length + 1)), 50);
    } else if (!isDeleting && currentText.length === phrase.length) {
      timer = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && currentText.length > 0) {
      timer = setTimeout(() => setCurrentText(phrase.slice(0, currentText.length - 1)), 30);
    } else if (isDeleting && currentText.length === 0) {
      setIsDeleting(false);
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhrase]);

  return (
    <span>
      {currentText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

const testimonials = [
  {
    name: "Tatenda M.",
    grade: "Form 4, Harare",
    text: "I was failing maths every term. After using ZimMaths for 2 weeks before exams, I passed with a B. The AI tutor explains everything so clearly!",
    avatar: "T",
    color: "#1565C0",
  },
  {
    name: "Chiedza N.",
    grade: "Form 3, Bulawayo",
    text: "The practice papers are exactly like the real ZIMSEC exam. I love how it shows me step-by-step solutions. Worth every cent.",
    avatar: "C",
    color: "#2E7D32",
  },
  {
    name: "Farai K.",
    grade: "Form 4, Mutare",
    text: "The daily challenges keep me motivated. I compete with my friends on the leaderboard. We're all improving together!",
    avatar: "F",
    color: "#6A1B9A",
  },
];

const topics = [
  { icon: "➕", name: "General Arithmetic" },
  { icon: "🔢", name: "Algebra" },
  { icon: "📐", name: "Geometry" },
  { icon: "📊", name: "Statistics" },
  { icon: "🔺", name: "Trigonometry" },
  { icon: "🎲", name: "Probability" },
  { icon: "📏", name: "Mensuration" },
  { icon: "🔣", name: "Matrices" },
  { icon: "➡️", name: "Vectors" },
  { icon: "📉", name: "Graphs & Variation" },
  { icon: "💰", name: "Financial Maths" },
  { icon: "🔵", name: "Sets" },
  { icon: "🔢", name: "Number Bases" },
  { icon: "📍", name: "Coordinate Geometry" },
  { icon: "📏", name: "Measurement" },
];

export default function Home() {
  return (
    <main>

      {/* Hero Section */}
      <section className="bg-brand-800 text-white pt-6 pb-24 px-6 text-center">
        <div className="max-w-4xl mx-auto">
          <span className="bg-brand-600 text-brand-100 text-lg font-semibold px-6 py-3 rounded-full mb-6 inline-block mt-0">
            🎓 Built specifically for ZIMSEC O-Level Maths Students
          </span>
          <h1 className="text-5xl font-bold mb-4 mt-4">Pass ZIMSEC Maths.</h1>
          <h1 className="text-5xl font-bold mb-6 text-brand-300">Build Your Future.</h1>
          <p className="text-xl mb-10 text-brand-100 max-w-2xl mx-auto leading-relaxed min-h-[60px]">
            <TypewriterText />
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/register" className="bg-white text-brand-800 hover:bg-brand-50 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition">
              Start Learning Free
            </a>
            <a href="/papers" className="border-2 border-white hover:bg-brand-700 px-8 py-4 rounded-lg font-bold text-lg transition">
              Browse Practice Papers
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-brand-900 text-white py-6 px-6">
        <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-12 text-center">
          <div>
            <p className="text-3xl font-bold text-brand-300">50+</p>
            <p className="text-brand-200 text-sm">Practice Papers</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-300">15</p>
            <p className="text-brand-200 text-sm">ZIMSEC Topics</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-300">1,374+</p>
            <p className="text-brand-200 text-sm">Solved Questions</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-brand-300">24/7</p>
            <p className="text-brand-200 text-sm">AI Tutor</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-brand-900 mb-4">Everything You Need To Pass</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">One platform. All the tools. Designed for ZIMSEC.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">📄</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">Practice Papers Library</h3>
              <p className="text-gray-600">50+ ZimMaths practice papers covering all O-Level topics with full step-by-step solutions.</p>
            </div>
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">15 Topic Lessons</h3>
              <p className="text-gray-600">All ZIMSEC syllabus topics covered with clear explanations, worked examples and video summaries.</p>
            </div>
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">AI Maths Tutor</h3>
              <p className="text-gray-600">Ask anything. Get instant step-by-step help from Takudzwa, our AI tutor trained on ZIMSEC maths.</p>
            </div>
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">✏️</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">Smart Practice Mode</h3>
              <p className="text-gray-600">Generate instant practice tests by topic and difficulty. Auto-marked with full explanations.</p>
            </div>
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">🏆</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">Daily Challenges</h3>
              <p className="text-gray-600">A new maths challenge every day. Compete with students across Zimbabwe on the leaderboard.</p>
            </div>
            <div className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
              <div className="text-4xl mb-4">📊</div>
              <h3 className="text-xl font-bold text-brand-900 mb-2">Performance Dashboard</h3>
              <p className="text-gray-600">Track your progress across all 15 topics. See your weak areas and focus your revision.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Topics Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-brand-900 mb-4">All 15 ZIMSEC Topics Covered</h2>
          <p className="text-center text-gray-500 mb-10 text-lg">Every topic on the O-Level syllabus — with lessons, examples and practice questions.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {topics.map((topic, i) => (
              <a key={i} href="/topics"
                className="bg-white rounded-xl p-4 border border-gray-200 hover:border-brand-300 hover:shadow-md transition text-center">
                <div className="text-2xl mb-2">{topic.icon}</div>
                <p className="text-sm font-semibold text-gray-700">{topic.name}</p>
              </a>
            ))}
          </div>
          <div className="text-center mt-8">
            <a href="/topics" className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block">
              Explore All Topics →
            </a>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-brand-900 mb-4">Students Are Passing</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Real results from Zimbabwe students just like you.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <div key={i} className="bg-brand-50 rounded-2xl p-6 border border-brand-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-sm"
                    style={{ backgroundColor: t.color }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{t.name}</p>
                    <p className="text-gray-500 text-xs">{t.grade}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed italic">"{t.text}"</p>
                <div className="mt-3 text-yellow-400 text-sm">★★★★★</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-6 bg-brand-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-brand-900 mb-4">Affordable For Every Student</h2>
          <p className="text-center text-gray-500 mb-12 text-lg">Less than the price of a bus fare. No excuses.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

            <div className="bg-white rounded-2xl shadow p-8 border border-gray-200 flex flex-col">
              <h4 className="text-xl font-bold text-gray-800 mb-1">Free</h4>
              <p className="text-4xl font-bold text-brand-800 mb-1">$0</p>
              <p className="text-gray-400 text-sm mb-6">Forever free</p>
              <ul className="text-gray-600 space-y-2 mb-8 text-sm flex-1">
                <li>✅ 5 past exam papers</li>
                <li>✅ Daily maths challenge</li>
                <li>✅ Basic topic notes</li>
                <li>✅ 5 AI questions/day</li>
              </ul>
              <a href="/register" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold transition">
                Get Started Free
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow p-8 border border-brand-200 flex flex-col">
              <h4 className="text-xl font-bold text-gray-800 mb-1">2 Weeks</h4>
              <p className="text-4xl font-bold text-brand-800 mb-1">$3</p>
              <p className="text-gray-400 text-sm mb-6">Perfect for exam season</p>
              <ul className="text-gray-600 space-y-2 mb-8 text-sm flex-1">
                <li>✅ All 50+ past papers</li>
                <li>✅ Full solutions</li>
                <li>✅ Unlimited practice</li>
                <li>✅ Unlimited AI tutor</li>
              </ul>
              <a href="/upgrade" className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
                Unlock for $3
              </a>
            </div>

            <div className="bg-white rounded-2xl shadow p-8 border border-brand-200 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-sm font-bold px-4 py-1 rounded-full whitespace-nowrap">
                POPULAR
              </div>
              <h4 className="text-xl font-bold text-gray-800 mb-1">1 Month</h4>
              <p className="text-4xl font-bold text-brand-800 mb-1">$5</p>
              <p className="text-gray-400 text-sm mb-6">Structured monthly prep</p>
              <ul className="text-gray-600 space-y-2 mb-8 text-sm flex-1">
                <li>✅ All 50+ past papers</li>
                <li>✅ Full solutions</li>
                <li>✅ Unlimited practice</li>
                <li>✅ Unlimited AI tutor</li>
                <li>✅ Performance dashboard</li>
                <li>✅ Progress tracking</li>
              </ul>
              <a href="/upgrade" className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
                Unlock for $5
              </a>
            </div>

            <div className="bg-brand-800 rounded-2xl shadow p-8 border border-brand-700 relative flex flex-col">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1 rounded-full whitespace-nowrap">
                ⭐ BEST VALUE
              </div>
              <h4 className="text-xl font-bold text-white mb-1">1 Year</h4>
              <p className="text-4xl font-bold text-brand-300 mb-1">$45</p>
              <p className="text-brand-300 text-sm mb-6">Full year access</p>
              <ul className="text-brand-100 space-y-2 mb-8 text-sm flex-1">
                <li>✅ Everything in Premium</li>
                <li>✅ Performance dashboard</li>
                <li>✅ Exam predictions</li>
                <li>✅ Offline access</li>
              </ul>
              <a href="/upgrade" className="block text-center bg-white hover:bg-brand-50 text-brand-800 py-3 rounded-lg font-semibold transition">
                Unlock for $45
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-6 bg-brand-800 text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl font-bold mb-4">Your ZIMSEC Exam Is Coming.</h2>
          <p className="text-brand-200 text-xl mb-8">Don't leave it to chance. Start studying smarter today — it's free.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <a href="/register"
              className="bg-white text-brand-800 hover:bg-brand-50 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition">
              Create Free Account
            </a>
            <a href="/topics"
              className="border-2 border-white hover:bg-brand-700 px-8 py-4 rounded-lg font-bold text-lg transition">
              Browse Topics
            </a>
          </div>
          <p className="text-brand-400 text-sm mt-6">No credit card required. Free forever.</p>
        </div>
      </section>

    </main>
  );
}
