export default function LoginPage() {
  return (
    <main className="min-h-screen bg-brand-50 flex flex-col">

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl shadow p-8 w-full max-w-md border border-gray-200">

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-brand-800 mb-2">Welcome Back</h1>
            <p className="text-gray-500">Log in to continue studying</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                placeholder="you@email.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-sm text-brand-700 hover:text-brand-600">Forgot password?</a>
            </div>

            <button className="w-full bg-brand-700 hover:bg-brand-600 text-white py-3 rounded-lg font-bold text-lg transition">
              Log In
            </button>

            <div className="relative my-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-4 text-gray-400">or</span>
              </div>
            </div>

            <button className="w-full border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 rounded-lg font-semibold flex items-center justify-center gap-3 transition">
              <span>🔵</span> Continue with Google
            </button>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Don't have an account?{" "}
            <a href="/register" className="text-brand-700 font-semibold hover:text-brand-600">Register free</a>
          </p>

        </div>
      </div>

    </main>
  );
}