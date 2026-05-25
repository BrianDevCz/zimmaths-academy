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

    // Decode HTML entities first
    let processed = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&le;/g, '\\leq')
      .replace(/&ge;/g, '\\geq')
      .replace(/&ne;/g, '\\neq');

    // Convert \\(...\\) to $...$ (inline math)
    processed = processed.replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$');

    // Convert \\[...\\] to $$...$$ (display math)
    processed = processed.replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$');

    // Ensure \\boxed{} works by making sure it's inside math mode
    // If \\boxed appears outside $...$, wrap it in $$
    processed = processed.replace(/(?<!\$)(\\boxed\{[^}]+\})(?!\$)/g, '$$$$$1$$$$');

    return processed;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]}
      components={{
        // Custom renderer for code blocks to handle math in tables
        code({ node, inline, className, children, ...props }: any) {
          if (className?.includes('language-math')) {
            return <span className={className}>{children}</span>;
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {processContent(children)}
    </ReactMarkdown>
  );
}