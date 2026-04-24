"use client";
import { useAuth } from "../context/AuthContext";
import Image from "next/image";
import { useState } from "react";

const WHATSAPP_NUMBER = "263714390637";
const WHATSAPP_MESSAGE = "Hello ZimMaths Academy! I need help with:";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const PAYMENT_LOGOS = [
  { id: "ecocash", label: "EcoCash", src: "/logos/ecocash.png", fallbackColor: "#E63946", fallbackText: "EC" },
  { id: "innbucks", label: "Innbucks", src: "/logos/innbucks.png", fallbackColor: "#2196F3", fallbackText: "IB" },
  { id: "omari", label: "Omari", src: "/logos/omari.png", fallbackColor: "#4CAF50", fallbackText: "OM" },
];

function PaymentBadge({ logo }: { logo: typeof PAYMENT_LOGOS[0] }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        title={logo.label}
        className="flex items-center justify-center rounded-lg text-white text-xs font-bold"
        style={{ backgroundColor: logo.fallbackColor, width: 56, height: 36 }}
      >
        {logo.fallbackText}
      </div>
    );
  }

  return (
    <div
      title={logo.label}
      className="bg-white rounded-lg flex items-center justify-center overflow-hidden"
      style={{ width: 56, height: 36, padding: 6 }}
    >
      <Image
        src={logo.src}
        alt={logo.label}
        width={44}
        height={24}
        className="object-contain w-full h-full"
        onError={() => setImgError(true)}
      />
    </div>
  );
}

export default function Footer() {
  const { user, isPremium } = useAuth();

  return (
    <footer className="bg-brand-900 text-brand-200 py-12 px-6">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">

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

          {/* Payment logos — only for non-premium or logged out users */}
          {!isPremium && (
            <div className="mt-4">
              <p className="text-brand-400 text-xs mb-2">Upgrade from $3 · Pay via:</p>
              <div className="flex items-center gap-2">
                {PAYMENT_LOGOS.map((logo) => (
                  <a key={logo.id} href="/upgrade" title={`Pay with ${logo.label}`}>
                    <PaymentBadge logo={logo} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Study Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Study</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/papers" className="hover:text-white transition">Practice Papers</a></li>
            <li><a href="/topics" className="hover:text-white transition">All Topics</a></li>
            <li><a href="/practice" className="hover:text-white transition">Practice Mode</a></li>
            <li><a href="/leaderboard" className="hover:text-white transition">Leaderboard</a></li>
          </ul>
        </div>

        {/* Account Links */}
        <div>
          <h4 className="text-white font-semibold mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            {user ? (
              <>
                <li><a href="/profile" className="hover:text-white transition">My Profile</a></li>
                <li><a href="/dashboard" className="hover:text-white transition">Dashboard</a></li>
                {!isPremium && (
                  <li><a href="/upgrade" className="hover:text-white transition">Upgrade to Premium</a></li>
                )}
              </>
            ) : (
              <>
                <li><a href="/register" className="hover:text-white transition">Register Free</a></li>
                <li><a href="/login" className="hover:text-white transition">Login</a></li>
                <li><a href="/upgrade" className="hover:text-white transition">Upgrade to Premium</a></li>
              </>
            )}
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="text-white font-semibold mb-3">Support</h4>
          <p className="text-brand-300 text-sm mb-4 leading-relaxed">
            Need help? Chat with us on WhatsApp — we typically reply within a few hours.
          </p>
          <a
            href={WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat on WhatsApp
          </a>
          <p className="text-brand-400 text-xs mt-3">Mon–Sat · 8am–8pm CAT</p>
        </div>

      </div>

      {/* Bottom Bar */}
      <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-brand-800 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-brand-400">© 2026 ZimMaths Academy · zimmaths.com</p>
        <p className="text-sm text-brand-400">Built for Zimbabwe's O-Level students 🇿🇼</p>
      </div>
    </footer>
  );
}
