async function getPapers() {
  try {
    const res = await fetch('http://localhost:5000/api/papers', {
      cache: 'no-store'
    });
    const data = await res.json();
    return data.data;
  } catch (error) {
    return [];
  }
}

export default async function PapersPage() {
  const papers = await getPapers();

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Page Title */}
      <section className="bg-brand-800 text-white py-12 px-6 text-center">
        <h1 className="text-4xl font-bold mb-3">ZimMaths Practice Papers</h1>
        <p className="text-brand-200 text-lg">Original O-Level Mathematics papers — Step-by-step solutions</p>
      </section>

      {/* Filters */}
      <section className="bg-white px-6 py-4 shadow-sm flex gap-4 flex-wrap">
        <select className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700">
          <option>All Years</option>
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
        {papers.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-xl">No papers found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {papers.map((paper: any) => (
              <div key={paper.id} className="bg-white rounded-2xl shadow p-6 border border-gray-200 hover:shadow-md transition">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 capitalize">
                      {paper.session} {paper.year}
                    </h3>
                    <p className="text-gray-500">Paper {paper.paperNumber}</p>
                  </div>
                  {paper.isFree ? (
                    <span className="bg-brand-100 text-brand-800 text-sm font-semibold px-3 py-1 rounded-full">FREE</span>
                  ) : (
                    <span className="bg-yellow-100 text-yellow-800 text-sm font-semibold px-3 py-1 rounded-full">PREMIUM</span>
                  )}
                </div>

                {/* Badges */}
                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {paper.questionCount} Questions
                  </span>
                  <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    {paper.totalMarks} Marks
                  </span>
                  <span className={`text-xs px-2 py-1 rounded capitalize ${
                    paper.difficultyOverall === 'easy' ? 'bg-green-100 text-green-700' :
                    paper.difficultyOverall === 'hard' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {paper.difficultyOverall}
                  </span>
                </div>

                {/* Button */}
                {paper.isFree ? (
                  <a href={`/papers/${paper.id}`} className="block text-center bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-semibold transition">
                    View Paper →
                  </a>
                ) : (
                  <a href="/register" className="block text-center bg-gray-100 hover:bg-gray-200 text-gray-600 py-3 rounded-lg font-semibold">
                    🔒 Unlock — Upgrade for $3
                  </a>
                )}

              </div>
            ))}
          </div>
        )}
      </section>

    </main>
  );
}