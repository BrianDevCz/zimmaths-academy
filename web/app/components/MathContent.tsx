import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw';
import 'katex/dist/katex.min.css';

function InlineMath({ text }: { text: string }) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    const render = async () => {
      try {
        const katex = await import('katex');
        let math = text;
        const isDisplay = math.includes('$$');
        
        if (isDisplay) {
          math = math.replace(/^\$\$/, '').replace(/\$\$$/, '').trim();
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

  if (!html) return <span className="break-words">{text}</span>;
  return <span className="break-words inline-block" dangerouslySetInnerHTML={{ __html: html }} />;
}

function hasMathContent(text: string): boolean {
  if (!text) return false;
  if (/\$\$[^\$]+\$\$/.test(text) || /\$[^$\s][^$\n]*\$/.test(text)) return true;
  if (/\\[a-zA-Z]+/.test(text)) return true;
  if (/\\leq|\\geq|\\neq|\\times|\\div/.test(text)) return true;
  if (/[≤≥≠×÷°πθαβΔ∑∫√∞≈±]/.test(text)) return true;
  return false;
}

export default function MathContent({ children }: { children: string }) {
  if (typeof children !== 'string') return null;
  if (!children || children.trim() === '' || children === 'null' || children === 'undefined') return null;

  const processContent = (content: string): string => {
    let processed = content;
    processed = processed.replace(/\\n/g, '\n');

    const entityMap: Record<string, string> = {
      '&lt;': '<', '&gt;': '>', '&amp;': '&', '&quot;': '"', '&#39;': "'",
      '&#x27;': "'", '&le;': '\\leq', '&ge;': '\\geq', '&ne;': '\\neq',
      '&times;': '\\times', '&divide;': '\\div', '&deg;': '^{\\circ}',
      '&pi;': '\\pi', '&theta;': '\\theta', '&alpha;': '\\alpha',
      '&beta;': '\\beta', '&sum;': '\\sum', '&Delta;': '\\Delta',
      '&radic;': '\\sqrt', '&infin;': '\\infty', '&approx;': '\\approx',
      '&plusmn;': '\\pm', '&frac12;': '\\frac{1}{2}',
      '&frac14;': '\\frac{1}{4}', '&frac34;': '\\frac{3}{4}',
    };

    for (const [entity, replacement] of Object.entries(entityMap)) {
      processed = processed.split(entity).join(replacement);
    }

    processed = processed.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));

    // Convert escaped LaTeX delimiters to $/$$ format for remark-math
    processed = processed.replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$');
    processed = processed.replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$');
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

    // Convert inline matrices to display math for better rendering
    processed = processed.replace(
      /\$([\s\S]*?)\$/g,
      (match, mathContent) => {
        if (mathContent.includes('\\begin{pmatrix}') || 
            mathContent.includes('\\begin{matrix}') || 
            mathContent.includes('\\begin{vmatrix}') ||
            mathContent.includes('\\begin{bmatrix}') ||
            mathContent.includes('\\begin{Bmatrix}')) {
          return '$$' + mathContent.trim() + '$$';
        }
        return match;
      }
    );

    // Fix common LaTeX commands that got double-escaped
    processed = processed.replace(/\\\\(text|frac|sqrt|left|right|cdot|times|div|pm|mp|leq|geq|neq|approx|infty|pi|theta|alpha|beta|Delta|sum|int|prod|lim|log|ln|sin|cos|tan|arcsin|arccos|arctan|begin|end)/g, '\\$1');

    processed = processed.replace(/\n{3,}/g, '\n\n');

    return processed;
  };

  const processed = processContent(children);

  const processCellChildren = (children: React.ReactNode): React.ReactNode => {
    return React.Children.map(children, (child) => {
      if (typeof child === 'string' && hasMathContent(child)) {
        return <InlineMath text={child} />;
      }
      return child;
    });
  };

  return (
    <div className="math-content max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm as any, remarkMath as any]}
        rehypePlugins={[rehypeKatex as any, rehypeRaw as any]}
        components={{
          table: ({ children, ...props }: any) => (
            <div className="w-full overflow-x-auto">
              <table {...props} className="border-collapse border-2 border-gray-600 my-4 w-full">
                {children}
              </table>
            </div>
          ),
          thead: ({ children, ...props }: any) => (
            <thead {...props} className="bg-gray-100">
              {children}
            </thead>
          ),
          th: ({ children, ...props }: any) => (
            <th {...props} className="border-2 border-gray-600 px-3 py-2 text-center font-bold break-words whitespace-normal text-sm">
              {processCellChildren(children)}
            </th>
          ),
          td: ({ children, ...props }: any) => (
            <td {...props} className="border-2 border-gray-600 px-3 py-2 text-center break-words whitespace-normal text-sm">
              {processCellChildren(children)}
            </td>
          ),
          tr: ({ children, ...props }: any) => (
            <tr {...props} className="even:bg-gray-50 hover:bg-gray-100 transition-colors">
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