export default function PapersPage() {
  return (
    <main className="min-h-screen bg-gray-50">

      {/* Page Title */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">Past Exam Papers</h1>
        <p className="text-brand-200 text-lg">ZIMSEC O-Level Mathematics — 2010 to 2024</p>
      </section>

      {/* Filters */}
      <section className="bg-white px-6 py-4 shadow-sm flex gap-4 flex-wrap">
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
          <option>All Years</option>
          <option>2024</option>
          <option>2023</option>
          <option>2022</option>
          <option>2021</option>
          <option>2020</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
          <option>All Sessions</option>
          <option>November</option>
          <option>June</option>
        </select>
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
          <option>All Papers</option>
          <option>Paper 1</option>
          <option>Paper 2</option>
        </select>
      </section>

      {/* Papers Grid */}
      <section className="px-6 py-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Free Paper Card */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">November 2022</h3>
                <p className="text-gray-500">Paper 1 — Non Calculator</p>
              </div>
              <span className="bg-brand-100 text-brand-800 text-sm font-semibold px-3 py-1 rounded-full">FREE</span>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">30 Questions</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">80 Marks</span>
              <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded">Medium</span>
            </div>
            <a href="#" className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
              View Paper
            </a>
          </div>

          {/* Premium Paper Card */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">June 2022</h3>
                <p className="text-gray-500">Paper 2 — Calculator</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">PREMIUM</span>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">25 Questions</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">100 Marks</span>
              <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded">Hard</span>
            </div>
            <a href="#" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-semibold">
              🔒 Unlock — Upgrade for $3
            </a>
          </div>

          {/* Premium Paper Card 2 */}
          <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">November 2021</h3>
                <p className="text-gray-500">Paper 1 — Non Calculator</p>
              </div>
              <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">PREMIUM</span>
            </div>
            <div className="flex gap-2 mb-4 flex-wrap">
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">30 Questions</span>
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">80 Marks</span>
              <span className="bg-brand-100 text-brand-700 text-xs px-2 py-1 rounded">Easy</span>
            </div>
            <a href="#" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-semibold">
              🔒 Unlock — Upgrade for $3
            </a>
          </div>

        </div>
      </section>

    </main>
  );
}