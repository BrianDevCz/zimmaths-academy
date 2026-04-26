import { Metadata } from "next";
import SharePageClient from "./SharePageClient";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export async function generateMetadata({
  params,
}: {
  params: { questionId: string };
}): Promise<Metadata> {
  // Fetch question for title
  try {
    const res = await fetch(`${API_URL}/api/questions/${params.questionId}`, {
      cache: "no-store",
    });
    const data = await res.json();
    const q = data?.data;
    const topic = q?.topic?.name || "Maths";
    const title = `ZimMaths — ${topic} Question`;
    const description = `Can you solve this ${topic} question? Practice ZIMSEC O-Level Maths at zimmaths.com`;
    const imageUrl = `${API_URL}/api/share/${params.questionId}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: [{ url: imageUrl, width: 1200, height: 630 }],
        url: `https://zimmaths.com/share/${params.questionId}`,
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

export default function SharePage({
  params,
}: {
  params: { questionId: string };
}) {
  return <SharePageClient questionId={params.questionId} />;
}
