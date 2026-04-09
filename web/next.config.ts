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
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.geogebra.org https://www.youtube.com https://player.vimeo.com; img-src 'self' data: https://ucarecdn.com https://d9s36eq1lg.ucarecd.net;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;