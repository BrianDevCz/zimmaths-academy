import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import { SessionProvider } from "./components/SessionProvider";
import 'katex/dist/katex.min.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "ZimMaths Academy — ZIMSEC O-Level Maths Practice",
    template: "%s | ZimMaths Academy",
  },
  description: "Zimbabwe's #1 platform for ZIMSEC O-Level Mathematics. Practice past papers with step-by-step solutions, AI tutoring, daily challenges and topic lessons. Built for Form 3 & Form 4 students.",
  keywords: [
    "ZIMSEC maths", "O-Level Mathematics Zimbabwe", "ZIMSEC past papers",
    "Zimbabwe maths practice", "Form 3 maths", "Form 4 maths",
    "ZIMSEC 4004", "ZIMSEC 4008", "O-Level maths tutor Zimbabwe",
    "Zimbabwe past papers solutions", "maths AI tutor Zimbabwe",
    "ZimMaths", "ZimMaths Academy", "Zimbabwe school maths",
  ],
  authors: [{ name: "ZimMaths Academy", url: "https://zimmaths.com" }],
  creator: "ZimMaths Academy",
  publisher: "ZimMaths Academy",
  metadataBase: new URL("https://zimmaths.com"),
  alternates: {
    canonical: "https://zimmaths.com",
  },
  openGraph: {
    title: "ZimMaths Academy — ZIMSEC O-Level Maths Practice",
    description: "Zimbabwe's #1 platform for ZIMSEC O-Level Mathematics. Practice past papers, AI tutoring, daily challenges and topic lessons for Form 3 & 4 students.",
    url: "https://zimmaths.com",
    siteName: "ZimMaths Academy",
    locale: "en_ZW",
    type: "website",
    images: [
      {
        url: "https://zimmaths.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "ZimMaths Academy — Zimbabwe's #1 O-Level Maths Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ZimMaths Academy — ZIMSEC O-Level Maths Practice",
    description: "Zimbabwe's #1 platform for ZIMSEC O-Level Mathematics. Practice past papers, AI tutoring and daily challenges.",
    images: ["https://zimmaths.com/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your Google Search Console verification code once you get it:
    google: "google2b2ee8074de79b95",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css"
          integrity="sha384-n8MVd4RsNIU0tAv4ct0nTaAbDJwPJzDEaqSD1odI+WdtXRGWt2kTvGFasHpSy3SV"
          crossOrigin="anonymous"
        />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/Zimmaths_logo.png" />
      </head>
      <body className={`${inter.className} bg-gray-50`}>
        <SessionProvider>
          <AuthProvider>
            <Navbar />
            <div className="min-h-screen">{children}</div>
            <Footer />
          </AuthProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
