import { Metadata } from "next";
import SharePageClient from "./SharePageClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ questionId: string }>;
}): Promise<Metadata> {
  const { questionId } = await params;
  try {
    const res = await fetch(`${API_URL}/api/questions/${questionId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const q = data?.data;
    const topic = q?.topic?.name || "Maths";
    const title = `ZimMaths — ${topic} Question`;
    const description = `Can you solve this ${topic} question? Practice at zimmaths.com`;
    const imageUrl = `${API_URL}/api/share/${questionId}`;
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, width: 1200, height: 630 }],
        url: `https://zimmaths.com/share/${questionId}`,
        siteName: "ZimMaths",
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return { title: "ZimMaths — Maths Question" };
  }
}

export default async function SharePage({
  params,
}: {
  params: Promise<{ questionId: string }>;
}) {
  const { questionId } = await params;
  return <SharePageClient questionId={questionId} />;
}