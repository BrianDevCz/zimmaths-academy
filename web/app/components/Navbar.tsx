"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <nav className="bg-brand-800 text-white px-6 py-3 flex justify-between items-center shadow-lg">

      {/* Logo */}
      <a href="/" className="flex items-center gap-3">
        <Image
          src="/Zimmaths_logo.png"
          alt="ZimMaths Logo"
          width={65}
          height={65}
          className="rounded-lg"
          loading="eager"
          priority
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
        <a href="/daily" className="hover:text-brand-300 font-medium transition">Daily Challenge</a>
        <a href="/leaderboard" className="hover:text-brand-300 font-medium transition">Leaderboard</a>
        <a href="/ai-tutor" className="hover:text-brand-300 font-medium transition">AI Tutor</a>
      </div>

      {/* Auth Section */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-600 px-4 py-2 rounded-lg transition"
              >
                {/* Avatar */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white"
                  style={{ backgroundColor: user.avatarColour || "#1565C0" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{user.name.split(" ")[0]}</span>
                <span className="text-brand-300 text-xs">▼</span>
              </button>

              {/* Dropdown Menu */}
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <a href="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    📊 My Dashboard
                  </a>
                  <a href="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    👤 My Profile
                  </a>
                  <a href="/upgrade" className="block px-4 py-2 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition">
                    ⭐ Upgrade to Premium
                  </a>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <a href="/login" className="hover:text-brand-300 font-medium transition">Login</a>
            <a href="/register" className="bg-brand-500 hover:bg-brand-400 px-5 py-2 rounded-lg font-semibold transition shadow">
              Get Started
            </a>
          </>
        )}
      </div>

    </nav>
  );
}