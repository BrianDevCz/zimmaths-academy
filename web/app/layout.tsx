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
  title: "ZimMaths Academy — Pass O-Level Maths",
  description: "Zimbabwe's #1 O-Level Mathematics study platform. Practice papers, step-by-step solutions, AI tutor and daily challenges. Built for ZIMSEC students.",
  keywords: ["ZIMSEC", "O-Level Maths", "Zimbabwe", "Mathematics", "Past Papers", "Form 3", "Form 4"],
  openGraph: {
    title: "ZimMaths Academy — Pass O-Level Maths",
    description: "Zimbabwe's #1 O-Level Mathematics study platform. Practice papers, AI tutor and daily challenges.",
    url: "https://zimmaths.com",
    siteName: "ZimMaths Academy",
    locale: "en_ZW",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "ZimMaths Academy — Pass O-Level Maths",
    description: "Zimbabwe's #1 O-Level Mathematics study platform.",
  },
  metadataBase: new URL("https://zimmaths.com"),
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
