import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ucarecdn.com" },
      { protocol: "https", hostname: "d9s36eq1lg.ucarecd.net" },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // ── Content Security Policy ──────────────────────────
          {
            key: "Content-Security-Policy",
            value: [
              // Only load scripts from self and trusted CDNs
              "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com https://upload.uploadcare.com https://static.cloudflareinsights.com",
              // Styles from self and Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              // Images from self, data URIs, and our CDNs
              "img-src 'self' data: blob: https://ucarecdn.com https://d9s36eq1lg.ucarecd.net https://i.ytimg.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
              // Frames — YouTube, GeoGebra, Vimeo
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://www.geogebra.org https://player.vimeo.com",
              // API connections
              "connect-src 'self' https://zimmaths-academy-production.up.railway.app https://upload.uploadcare.com https://api.anthropic.com https://openrouter.ai https://cloudflareinsights.com",
              // Media (camera/microphone for OCR)
              "media-src 'self' blob:",
              // Workers (for KaTeX)
              "worker-src 'self' blob:",
              // No plugins
              "object-src 'none'",
              // Only load from HTTPS
              "upgrade-insecure-requests",
            ].join("; "),
          },

          // ── X-Frame-Options ──────────────────────────────────
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },

          // ── X-Content-Type-Options ───────────────────────────
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // ── Referrer Policy ──────────────────────────────────
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // ── Permissions Policy ───────────────────────────────
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },

          // ── Cross Origin Resource Policy ─────────────────────
          {
            key: "Cross-Origin-Resource-Policy",
            value: "cross-origin",
          },

          // ── Cross Origin Opener Policy ───────────────────────
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },

          // ── HSTS (already passing but add preload directive) ──
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
