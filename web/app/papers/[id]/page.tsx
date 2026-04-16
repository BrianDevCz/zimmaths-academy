import { API_URL } from '@/app/lib/api';
import QuestionCard from "./QuestionCard";

async function getPaper(id: string) {
  try {
    const res = await fetch(`${API_URL}/api/papers/` + id, {
      cache: "no-store",
    });
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paper = await getPaper(id);

  if (!paper) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Paper not found</h1>
          <a href="/papers" className="text-brand-700 hover:underline">Back to Papers</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <a href="/papers" className="text-brand-300 hover:text-white text-sm mb-4 inline-block">
            ← Back to Papers
          </a>
          <h1 className="text-3xl font-bold mb-2">{paper.title}</h1>
          <div className="flex gap-3 flex-wrap mt-4">
            <span className="bg-brand-700 px-3 py-1 rounded-full text-sm">
              {paper.questionCount} Questions
            </span>
            <span className="bg-brand-700 px-3 py-1 rounded-full text-sm">
              {paper.totalMarks} Marks
            </span>
            <span className="bg-brand-700 px-3 py-1 rounded-full text-sm capitalize">
              {paper.difficultyOverall} Difficulty
            </span>
            {paper.isFree && (
              <span className="bg-green-500 px-3 py-1 rounded-full text-sm font-semibold">FREE</span>
            )}
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">
          Questions ({paper.questions?.length || 0})
        </h2>

        {paper.questions?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-10 text-center border border-gray-200">
            <p className="text-gray-500 text-lg">No questions added yet.</p>
            <p className="text-gray-400 text-sm mt-2">Check back soon!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paper.questions?.map((question: any) => (
              <QuestionCard key={question.id} question={question} paperId={paper.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}