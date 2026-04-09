import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export default function LessonContent({ children }: { children: string }) {
  // Convert \(...\) to $...$ and \[...\] to $$...$$
  const processMath = (content: string) => {
    if (!content) return '';
    let processed = content.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    return processed;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
    >
      {processMath(children)}
    </ReactMarkdown>
  );
}