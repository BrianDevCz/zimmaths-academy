import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { AuthProvider } from "./context/AuthContext";
import 'katex/dist/katex.min.css';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ZimMaths Academy — O-Level Mathematics Portal",
  description: "Zimbabwe's #1 ZIMSEC O-Level Mathematics study platform. Past papers, step-by-step solutions, AI tutor and daily challenges.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
  <html lang="en">
    <body>
      <AuthProvider>
        <Navbar />
        {children}
        <Footer />
      </AuthProvider>
    </body>
  </html>
);
}