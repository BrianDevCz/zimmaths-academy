import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-bold text-brand-800 mb-4">404</div>
        <div className="text-6xl mb-6">🔢</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Page Not Found
        </h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          Looks like this page doesn't exist. Let's get you back to studying!
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/"
            className="bg-brand-700 hover:bg-brand-600 text-white px-6 py-3 rounded-lg font-semibold transition">
            Go Home
          </Link>
          <Link href="/topics"
            className="bg-white hover:bg-gray-50 text-brand-700 border border-brand-200 px-6 py-3 rounded-lg font-semibold transition">
            Browse Topics
          </Link>
          <Link href="/practice"
            className="bg-white hover:bg-gray-50 text-brand-700 border border-brand-200 px-6 py-3 rounded-lg font-semibold transition">
            Start Practice
          </Link>
        </div>
      </div>
    </main>
  );
}