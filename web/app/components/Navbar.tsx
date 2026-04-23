"use client";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const router = useRouter();
  const { user, logout, isPremium } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    setMobileOpen(false);
    router.push("/");
  };

  const navLinks = [
    { href: "/papers", label: "Papers" },
    { href: "/topics", label: "Topics" },
    { href: "/practice", label: "Practice" },
    { href: "/daily", label: "Daily Challenge" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/ai-tutor", label: "AI Tutor" },
    { href: "/search", label: "🔍 Search" },
  ];

  return (
    <nav className="bg-brand-800 text-white shadow-lg relative z-50">
      <div className="px-4 py-3 flex justify-between items-center">

        {/* Logo */}
        <a href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/Zimmaths_logo.png"
            alt="ZimMaths Logo"
            width={50}
            height={50}
            className="rounded-lg"
            loading="eager"
            priority
          />
          <div>
            <span className="text-lg font-bold text-white">ZIM</span>
            <span className="text-lg font-bold text-brand-300">MATHS</span>
            <span className="text-xs text-brand-300 block leading-none">.com</span>
          </div>
        </a>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-5">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-brand-300 font-medium transition text-sm">
              {link.label}
            </a>
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 bg-brand-700 hover:bg-brand-600 px-3 py-2 rounded-lg transition"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                  style={{ backgroundColor: user.avatarColour || "#1565C0" }}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-sm">{user.name.split(" ")[0]}</span>
                <span className="text-brand-300 text-xs">▼</span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <a href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    📊 My Dashboard
                  </a>
                  <a href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    👤 My Profile
                  </a>
                  <a href="/bookmarks" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    📌 My Bookmarks
                  </a>
                  <a href="/badges" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
                    🏅 My Badges
                  </a>
                  {!isPremium && (
                    <a href="/upgrade" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition">
                      ⭐ Upgrade to Premium
                    </a>
                  )}
                  {isPremium && (
                    <div className="px-4 py-2 text-sm text-green-600 font-semibold">
                      ✅ Premium Member
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
                  >
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <a href="/login" className="hover:text-brand-300 font-medium transition text-sm">Login</a>
              <a href="/register" className="bg-brand-500 hover:bg-brand-400 px-4 py-2 rounded-lg font-semibold transition shadow text-sm">
                Get Started
              </a>
            </>
          )}
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-2">
          {user ? (
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1 bg-brand-700 px-2 py-1.5 rounded-lg"
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs text-white"
                style={{ backgroundColor: user.avatarColour || "#1565C0" }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium">{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <a href="/login" className="text-sm font-medium hover:text-brand-300 transition">
              Login
            </a>
          )}

          {/* Hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-brand-700 transition"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 bg-white mb-1"></div>
            <div className="w-5 h-0.5 bg-white mb-1"></div>
            <div className="w-5 h-0.5 bg-white"></div>
          </button>
        </div>
      </div>

      {/* Mobile user dropdown */}
      {menuOpen && user && (
        <div className="md:hidden absolute right-4 top-16 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">{user.email}</p>
          </div>
          <a href="/dashboard" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
            📊 My Dashboard
          </a>
          <a href="/profile" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
            👤 My Profile
          </a>
          <a href="/bookmarks" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
            📌 My Bookmarks
          </a>
          <a href="/badges" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-brand-50 transition">
            🏅 My Badges
          </a>
          {!isPremium && (
            <a href="/upgrade" onClick={() => setMenuOpen(false)} className="block px-4 py-2 text-sm text-brand-700 font-semibold hover:bg-brand-50 transition">
              ⭐ Upgrade to Premium
            </a>
          )}
          {isPremium && (
            <div className="px-4 py-2 text-sm text-green-600 font-semibold">
              ✅ Premium Member
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition rounded-b-xl"
          >
            🚪 Logout
          </button>
        </div>
      )}

      {/* Mobile nav menu */}
      {mobileOpen && (
        <div className="md:hidden bg-brand-900 border-t border-brand-700 px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="py-2 px-3 rounded-lg hover:bg-brand-700 font-medium transition text-sm"
            >
              {link.label}
            </a>
          ))}
          {!user && (
            <a
              href="/register"
              onClick={() => setMobileOpen(false)}
              className="mt-2 bg-brand-500 hover:bg-brand-400 px-4 py-2 rounded-lg font-semibold transition text-center text-sm"
            >
              Get Started Free
            </a>
          )}
        </div>
      )}
    </nav>
  );
}
