import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: "frame-src 'self' https://www.geogebra.org https://www.youtube.com https://player.vimeo.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;