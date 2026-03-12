import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="bg-brand-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">
      
      {/* Logo */}
      <a href="/" className="flex items-center gap-3">
        <Image
          src="/Zimmaths_logo.png"
          alt="ZimMaths Logo"
          width={85}
          height={85}
          className="rounded-lg"
        />
        <div>
          <span className="text-xl font-bold text-white">ZIM</span>
          <span className="text-xl font-bold text-brand-300">MATHS</span>
          <span className="text-sm text-brand-300 block leading-none">.com</span>
        </div>
      </a>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-6">
        <a href="/papers" className="hover:text-brand-300 font-medium transition">Papers</a>
        <a href="/topics" className="hover:text-brand-300 font-medium transition">Topics</a>
        <a href="/practice" className="hover:text-brand-300 font-medium transition">Practice</a>
        <a href="/leaderboard" className="hover:text-brand-300 font-medium transition">Leaderboard</a>
      </div>

      {/* Auth Buttons */}
      <div className="flex items-center gap-3">
        <a href="/login" className="hover:text-brand-300 font-medium transition">Login</a>
        <a href="/register" className="bg-brand-500 hover:bg-brand-400 px-5 py-2 rounded-lg font-semibold transition shadow">
          Get Started
        </a>
      </div>

    </nav>
  );
}