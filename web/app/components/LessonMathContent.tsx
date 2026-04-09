import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export default function LessonMathContent({ children }: { children: string }) {
  if (!children) return null;

  // Process content to fix LaTeX delimiters
  const processContent = (content: string) => {
    if (!content) return '';
    // Convert \(...\) to $...$ (inline math)
    let processed = content.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    // Convert \[...\] to $$...$$ (display math)
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    return processed;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
    >
      {processContent(children)}
    </ReactMarkdown>
  );
}