export default function Home() {
  return (
    <main className="min-h-screen bg-white">

      {/* Navigation */}
      <nav className="bg-green-800 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ZimMaths Academy</h1>
        <div className="flex gap-4">
          <a href="#" className="hover:text-green-300">Login</a>
          <a href="#" className="bg-green-500 hover:bg-green-400 px-4 py-2 rounded-lg font-semibold">Get Started</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-green-800 text-white py-20 px-6 text-center">
        <h2 className="text-5xl font-bold mb-4">Pass ZIMSEC Maths.</h2>
        <h2 className="text-5xl font-bold mb-6 text-green-300">Build Your Future.</h2>
        <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
          Zimbabwe's first interactive O-Level Mathematics platform. 
          Past papers explained step by step. AI tutor. Daily challenges. 
          All for less than the price of a textbook.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <a href="#" className="bg-white text-green-800 hover:bg-green-100 px-8 py-4 rounded-lg font-bold text-lg">
            Start Learning Free
          </a>
          <a href="#" className="border-2 border-white hover:bg-green-700 px-8 py-4 rounded-lg font-bold text-lg">
            See Past Papers
          </a>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 px-6 bg-gray-50">
        <h3 className="text-3xl font-bold text-center text-green-800 mb-4">Affordable For Every Student</h3>
        <p className="text-center text-gray-600 mb-12">Less than the price of a bus fare. No excuses.</p>
        <div className="flex gap-6 justify-center flex-wrap">

          {/* Free Plan */}
          <div className="bg-white rounded-2xl shadow p-8 w-72 border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">Free</h4>
            <p className="text-4xl font-bold text-green-800 mb-6">$0</p>
            <ul className="text-gray-600 space-y-2 mb-8">
              <li>✅ 5 past exam papers</li>
              <li>✅ Daily maths challenge</li>
              <li>✅ Basic topic notes</li>
              <li>✅ 5 AI tutor questions/day</li>
            </ul>
            <a href="#" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold">
              Get Started
            </a>
          </div>

          {/* 2 Weeks Plan */}
          <div className="bg-white rounded-2xl shadow p-8 w-72 border border-gray-200">
            <h4 className="text-xl font-bold text-gray-800 mb-2">2 Weeks</h4>
            <p className="text-4xl font-bold text-green-800 mb-6">$3</p>
            <ul className="text-gray-600 space-y-2 mb-8">
              <li>✅ All 50+ past papers</li>
              <li>✅ Full step-by-step solutions</li>
              <li>✅ Unlimited practice tests</li>
              <li>✅ Unlimited AI tutor</li>
            </ul>
            <a href="#" className="block text-center bg-green-700 hover:bg-green-600 text-white py-3 rounded-lg font-semibold">
              Unlock for $3
            </a>
          </div>

          {/* Annual Plan */}
          <div className="bg-green-800 rounded-2xl shadow p-8 w-72 border border-green-700 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-yellow-900 text-sm font-bold px-4 py-1 rounded-full">
              BEST VALUE
            </div>
            <h4 className="text-xl font-bold text-white mb-2">1 Year</h4>
            <p className="text-4xl font-bold text-green-300 mb-6">$45</p>
            <ul className="text-green-100 space-y-2 mb-8">
              <li>✅ Everything in Premium</li>
              <li>✅ Performance dashboard</li>
              <li>✅ Exam predictions</li>
              <li>✅ Offline access</li>
            </ul>
            <a href="#" className="block text-center bg-white hover:bg-green-100 text-green-800 py-3 rounded-lg font-semibold">
              Unlock for $45
            </a>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="bg-green-900 text-green-200 text-center py-8 px-6">
        <p className="text-xl font-bold text-white mb-2">ZimMaths Academy</p>
        <p className="mb-4">Zimbabwe's O-Level Mathematics Study Portal</p>
        <p className="text-sm text-green-400">© 2025 ZimMaths Academy · zimmaths.com</p>
      </footer>

    </main>
  );
}