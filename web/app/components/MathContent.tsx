import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

export default function MathContent({ children }: { children: string }) {
  if (!children) return null;

  const processContent = (content: string) => {
    if (!content) return '';

    // Step 1: Decode escaped newlines (from CSV import)
    let processed = content.replace(/\\n/g, '\n');

    // Step 2: Decode HTML entities
    processed = processed
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&le;/g, '\\leq')
      .replace(/&ge;/g, '\\geq')
      .replace(/&ne;/g, '\\neq');

    // Step 3: Convert \\(...\\) to $...$ (inline math)
    processed = processed.replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$');

    // Step 4: Convert \\[...\\] to $$...$$ (display math)
    processed = processed.replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$');

    return processed;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm as any, remarkMath as any]}
      rehypePlugins={[rehypeKatex as any, rehypeRaw as any]}
    >
      {processContent(children)}
    </ReactMarkdown>
  );
}