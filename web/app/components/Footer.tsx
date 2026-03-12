export default function Footer() {
  return (
    <footer className="bg-brand-900 text-brand-200 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Brand */}
        <div>
          <h3 className="text-xl font-bold text-white mb-3">
            <span className="text-white">ZIM</span>
            <span className="text-brand-300">MATHS</span>
            <span className="text-brand-300">.com</span>
          </h3>
          <p className="text-brand-300 text-sm leading-relaxed">
            Zimbabwe's O-Level Mathematics Study Portal. Built for ZIMSEC students. Affordable. Accessible. Exam-focused.
          </p>
        </div>

        {/* Study Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Study</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/papers" className="hover:text-white transition">Past Papers</a></li>
            <li><a href="/topics" className="hover:text-white transition">All Topics</a></li>
            <li><a href="/practice" className="hover:text-white transition">Practice Mode</a></li>
            <li><a href="/leaderboard" className="hover:text-white transition">Leaderboard</a></li>
          </ul>
        </div>

        {/* Account Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/register" className="hover:text-white transition">Register Free</a></li>
            <li><a href="/login" className="hover:text-white transition">Login</a></li>
            <li><a href="/upgrade" className="hover:text-white transition">Upgrade to Premium</a></li>
          </ul>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-brand-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-brand-400">© 2025 ZimMaths Academy · zimmaths.com</p>
        <p className="text-sm text-brand-400">Built for Zimbabwe's O-Level students 🇿🇼</p>
      </div>

    </footer>
  );
}