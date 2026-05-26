import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';

import 'katex/dist/katex.min.css';

interface MathContentProps {
  children: string;
}

export default function MathContent({
  children,
}: MathContentProps) {
  if (!children) return null;

  const processContent = (content: string) => {
    if (!content) return '';

    // -----------------------------------
    // Step 1: Decode escaped newlines
    // -----------------------------------
    let processed = content.replace(/\\n/g, '\n');

    // -----------------------------------
    // Step 2: Decode HTML entities
    // -----------------------------------
    processed = processed
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&le;/g, '\\leq')
      .replace(/&ge;/g, '\\geq')
      .replace(/&ne;/g, '\\neq');

    // -----------------------------------
    // Step 3: Convert \\(...\\) -> $...$
    // -----------------------------------
    processed = processed
      .replace(/\\\\\(/g, '$')
      .replace(/\\\\\)/g, '$');

    // -----------------------------------
    // Step 4: Convert \\[...\\] -> $$...$$
    // -----------------------------------
    processed = processed
      .replace(/\\\\\[/g, '$$')
      .replace(/\\\\\]/g, '$$');

    // -----------------------------------
    // Step 5: Escape currency dollar signs
    // -----------------------------------
    //
    // Examples:
    // $5
    // $5.00
    // $1,200
    // $0.15/kWh
    //
    // Converts them into:
    // \$5
    // \$5.00
    //
    // So remark-math does NOT treat them as LaTeX.
    //
    // Real math such as:
    // $x^2$
    // $\frac{1}{2}$
    //
    // is NOT affected.
    //
    processed = processed.replace(
      /\$(\d[\d,.]*(?:\.\d+)?(?:\/[a-zA-Z]+)?)(?!\$)/g,
      '\\$$1'
    );

    return processed;
  };

  return (
    <div className="math-content prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
        ]}
        rehypePlugins={[
          rehypeKatex,
          rehypeRaw,
        ]}
        components={{
          table: ({ children, ...props }: any) => (
            <table
              {...props}
              className="border-collapse border border-gray-300 my-4 w-full"
            >
              {children}
            </table>
          ),

          thead: ({ children, ...props }: any) => (
            <thead
              {...props}
              className="bg-gray-100"
            >
              {children}
            </thead>
          ),

          th: ({ children, ...props }: any) => (
            <th
              {...props}
              className="border border-gray-300 px-4 py-2 text-left font-semibold"
            >
              {children}
            </th>
          ),

          td: ({ children, ...props }: any) => (
            <td
              {...props}
              className="border border-gray-300 px-4 py-2"
            >
              {children}
            </td>
          ),

          tr: ({ children, ...props }: any) => (
            <tr
              {...props}
              className="even:bg-gray-50"
            >
              {children}
            </tr>
          ),
        }}
      >
        {processContent(children)}
      </ReactMarkdown>
    </div>
  );
}