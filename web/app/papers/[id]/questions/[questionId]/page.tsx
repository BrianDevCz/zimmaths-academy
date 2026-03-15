async function getQuestion(questionId: string) {
  try {
    const res = await fetch(
      "http://localhost:5000/api/questions/" + questionId,
      { cache: "no-store" }
    );
    const data = await res.json();
    return data.data;
  } catch (error) {
    return null;
  }
}

export default async function QuestionPage({
  params,
}: {
  params: Promise<{ id: string; questionId: string }>;
}) {
  const { id, questionId } = await params;
  const question = await getQuestion(questionId);

  if (!question) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Question not found
          </h1>
          <a href={"/papers/" + id} className="text-brand-700 hover:underline">
            Back to Paper
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-brand-800 text-white py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <a
            href={"/papers/" + id}
            className="text-brand-300 hover:text-white text-sm mb-4 inline-block"
          >
            Back to Paper
          </a>
          <div className="flex items-center gap-4 mt-2">
            <span className="bg-white text-brand-800 w-12 h-12 rounded-full flex items-center justify-center font-bold">
              Q{question.questionNumber}
            </span>
            <div>
              <p className="text-brand-200 text-sm">{question.topic?.name}</p>
              <div className="flex gap-2 mt-1">
                <span className="bg-brand-700 text-white text-xs px-2 py-0.5 rounded capitalize">
                  {question.difficulty}
                </span>
                <span className="bg-brand-700 text-white text-xs px-2 py-0.5 rounded">
                  {question.marks} marks
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-6 py-10 space-y-6">

        {/* Question */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-3">
            Question
          </h2>
          <p className="text-gray-800 text-xl leading-relaxed">
            {question.questionText}
          </p>
        </div>

        {/* Solution */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200">
          <h2 className="text-sm font-semibold text-brand-700 uppercase tracking-wide mb-4">
            Step-by-Step Solution
          </h2>

          {question.isFree ? (
            <div className="space-y-4">
              {/* Solution Text */}
              <div className="bg-brand-50 rounded-xl p-4 border border-brand-100">
                <p className="text-gray-800 leading-relaxed">
                  {question.solutionText}
                </p>
              </div>

              {/* Marking Scheme */}
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <h3 className="text-sm font-semibold text-green-700 mb-2">
                  Marking Scheme
                </h3>
                <p className="text-green-800 text-sm">
                  This question is worth {question.marks} marks. 
                  Show all working clearly to earn full marks.
                </p>
              </div>
            </div>
          ) : (
            /* Premium Lock */
            <div className="text-center py-10">
              <div className="text-6xl mb-4">🔒</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                Premium Solution
              </h3>
              <p className="text-gray-500 mb-6">
                Unlock full step-by-step solutions for all questions.
              </p>
              <a
                href="/register"
                className="bg-brand-700 hover:bg-brand-600 text-white px-8 py-3 rounded-lg font-bold transition inline-block"
              >
                Unlock for $3
              </a>
            </div>
          )}
        </div>

        {/* WhatsApp Share */}
        <div className="bg-white rounded-2xl shadow p-6 border border-gray-200 text-center">
          <p className="text-gray-600 mb-4">
            Challenge your friends with this question!
          </p>
          <a
            href={
              "https://wa.me/?text=Can you solve this ZIMSEC Maths question? " +
              encodeURIComponent(question.questionText) +
              " - See solution at zimmaths.com"
            }
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-400 text-white px-6 py-3 rounded-lg font-semibold transition inline-block"
          >
            Share on WhatsApp
          </a>
        </div>

      </section>
    </main>
  );
}