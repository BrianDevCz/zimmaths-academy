"use client";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isSharePage = pathname.startsWith("/share/");

  return (
    <>
      {!isSharePage && <Navbar />}
      <div className="min-h-screen">{children}</div>
      {!isSharePage && <Footer />}
    </>
  );
}