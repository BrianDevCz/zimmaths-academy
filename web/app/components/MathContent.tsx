import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

// ── Inline Math Renderer (fallback for table cells) ──────────
function InlineMath({ text }: { text: string }) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const render = async () => {
      try {
        const katex = await import('katex');
        let math = text;
        const isDisplay = math.includes('$$');
        
        if (isDisplay) {
          math = math.replace(/\$\$/g, '').trim();
        } else {
          math = math.replace(/^\$/, '').replace(/\$$/, '').trim();
        }

        const rendered = katex.default.renderToString(math, {
          throwOnError: false,
          displayMode: isDisplay,
        });
        setHtml(rendered);
      } catch {
        setHtml(text);
      }
    };
    render();
  }, [text]);

  if (!html) return <span>{text}</span>;
  return <span dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Check if raw math delimiters are still present ────────────
function hasRawMath(text: string): boolean {
  return /\$\$[^\$]+\$\$/.test(text) || /\$[^$\s][^$\n]*\$/.test(text);
}

export default function MathContent({ children }: { children: string }) {
  if (typeof children !== 'string') {
    console.warn('MathContent expected string, got:', typeof children, children);
    return null;
  }
  if (!children || children.trim() === '' || children === 'null' || children === 'undefined') {
    return null;
  }

  const processContent = (content: string): string => {
    let processed = content;

    processed = processed.replace(/\\n/g, '\n');

    const entityMap: Record<string, string> = {
      '&lt;': '<',
      '&gt;': '>',
      '&amp;': '&',
      '&quot;': '"',
      '&#39;': "'",
      '&#x27;': "'",
      '&le;': '\\leq',
      '&ge;': '\\geq',
      '&ne;': '\\neq',
      '&times;': '\\times',
      '&divide;': '\\div',
      '&deg;': '^{\\circ}',
      '&pi;': '\\pi',
      '&theta;': '\\theta',
      '&alpha;': '\\alpha',
      '&beta;': '\\beta',
      '&sum;': '\\sum',
      '&Delta;': '\\Delta',
      '&radic;': '\\sqrt',
      '&infin;': '\\infty',
      '&approx;': '\\approx',
      '&plusmn;': '\\pm',
      '&frac12;': '\\frac{1}{2}',
      '&frac14;': '\\frac{1}{4}',
      '&frac34;': '\\frac{3}{4}',
    };

    for (const [entity, replacement] of Object.entries(entityMap)) {
      processed = processed.split(entity).join(replacement);
    }

    processed = processed.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

    processed = processed.replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$');
    processed = processed.replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$');
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

    processed = processed.replace(/\$\$([\s\S]*?)\$\$/g, (match, math) => {
      return '$$' + math.replace(/\\\\/g, '\\') + '$$';
    });
    processed = processed.replace(/\$([^$\n]+?)\$/g, (match, math) => {
      return '$' + math.replace(/\\\\/g, '\\') + '$';
    });

    processed = processed.replace(/\\\\(text|frac|sqrt|left|right|cdot|times|div|pm|mp|leq|geq|neq|approx|infty|pi|theta|alpha|beta|Delta|sum|int|prod|lim|log|ln|sin|cos|tan|arcsin|arccos|arctan)/g, '\\$1');
    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed;
  };

  const processed = processContent(children);

  const processCellChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string' && hasRawMath(child)) {
        return <InlineMath text={child} />;
      }
      return child;
    });
  };

  return (
    <div className="math-content prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm as any, remarkMath as any]}
        rehypePlugins={[rehypeKatex as any, rehypeRaw as any]}
        components={{
          table: ({ children, ...props }: any) => (
            <table {...props} className="border-collapse border border-gray-300 my-4 w-full table-fixed">
              {children}
            </table>
          ),
          thead: ({ children, ...props }: any) => (
            <thead {...props} className="bg-gray-100">
              {children}
            </thead>
          ),
          th: ({ children, ...props }: any) => (
            <th {...props} className="border border-gray-300 px-2 py-2 text-left font-semibold break-words whitespace-normal text-sm">
              {processCellChildren(children)}
            </th>
          ),
          td: ({ children, ...props }: any) => (
            <td {...props} className="border border-gray-300 px-2 py-2 break-words whitespace-normal text-sm">
              {processCellChildren(children)}
            </td>
          ),
          tr: ({ children, ...props }: any) => (
            <tr {...props} className="even:bg-gray-50">
              {children}
            </tr>
          ),
          img: ({ src, alt, ...props }: any) => (
            <img
              src={src}
              alt={alt || ''}
              {...props}
              className="max-w-full h-auto rounded-lg my-2"
              loading="lazy"
            />
          ),
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  );
}