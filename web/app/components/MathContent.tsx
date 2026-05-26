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

    // Step 3: Handle escaped dollar signs within math expressions
    // Convert $\$2{,}000$ to $\text{\$}2{,}000$ or just $2{,}000$ inside math
    processed = processed.replace(/\$\\\$/g, '$$'); // Fix double escaped dollars
    
    // Step 4: Convert \\(...\\) to $...$ (inline math)
    processed = processed.replace(/\\\\\(/g, '$').replace(/\\\\\)/g, '$');

    // Step 5: Convert \\[...\\] to $$...$$ (display math)
    processed = processed.replace(/\\\\\[/g, '$$').replace(/\\\\\]/g, '$$');

    // Step 6: Process the content to protect currency outside math and handle math properly
    let result = '';
    let inMath = false;
    let mathDelimiter = '';
    let mathContent = '';
    
    for (let i = 0; i < processed.length; i++) {
      // Check for display math $$...$$
      if (processed.substring(i, i + 2) === '$$' && !inMath) {
        inMath = true;
        mathDelimiter = '$$';
        mathContent = '';
        result += '$$';
        i++; // Skip the second $
        continue;
      } else if (processed.substring(i, i + 2) === '$$' && inMath && mathDelimiter === '$$') {
        inMath = false;
        mathDelimiter = '';
        // Process math content to handle escaped dollars
        mathContent = mathContent.replace(/\\\$/g, '\\$');
        result += mathContent + '$$';
        i++; // Skip the second $
        continue;
      }
      // Check for inline math $...$
      else if (processed[i] === '$' && !inMath && processed.substring(i, i + 2) !== '$$') {
        inMath = true;
        mathDelimiter = '$';
        mathContent = '';
        result += '$';
        continue;
      } else if (processed[i] === '$' && inMath && mathDelimiter === '$') {
        inMath = false;
        mathDelimiter = '';
        // Process math content to handle escaped dollars
        mathContent = mathContent.replace(/\\\$/g, '\\text{\\$}');
        result += mathContent + '$';
        continue;
      }
      
      // Collect math content
      if (inMath) {
        mathContent += processed[i];
      } else {
        // If we encounter a $ followed by a digit and we're NOT in math mode, protect it
        if (processed[i] === '$' && /\d/.test(processed[i + 1] || '')) {
          result += '&#36;';
        } else {
          result += processed[i];
        }
      }
    }

    return result;
  };

  return (
    <div className="math-content prose max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm as any, remarkMath as any]}
        rehypePlugins={[rehypeKatex as any, rehypeRaw as any]}
        components={{
          table: ({ children, ...props }: any) => (
            <table {...props} className="border-collapse border border-gray-300 my-4 w-full">
              {children}
            </table>
          ),
          thead: ({ children, ...props }: any) => (
            <thead {...props} className="bg-gray-100">
              {children}
            </thead>
          ),
          th: ({ children, ...props }: any) => (
            <th {...props} className="border border-gray-300 px-4 py-2 text-left font-semibold">
              {children}
            </th>
          ),
          td: ({ children, ...props }: any) => (
            <td {...props} className="border border-gray-300 px-4 py-2">
              {children}
            </td>
          ),
          tr: ({ children, ...props }: any) => (
            <tr {...props} className="even:bg-gray-50">
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