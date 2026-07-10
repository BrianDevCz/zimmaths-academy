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

    // Fix common LaTeX commands that got double-escaped.
    // NOTE: this is intentionally whitelisted to known command names only.
    // Do NOT replace this with a blanket /\\\\/g -> '\\' regex — that also
    // strips the \\ row-separator inside matrix/aligned/cases environments
    // (e.g. \begin{pmatrix}1&2\\3&4\end{pmatrix}) and corrupts matrices.
    processed = processed.replace(/\\\\(text|frac|dfrac|tfrac|sqrt|left|right|cdot|times|div|pm|mp|leq|geq|neq|approx|infty|equiv|propto|sim|simeq|cong|perp|parallel|angle|triangle|circ|degree|pi|theta|Theta|xi|Xi|mu|nu|lambda|Lambda|sigma|Sigma|phi|Phi|psi|Psi|omega|Omega|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|kappa|rho|tau|upsilon|chi|sum|int|iint|oint|prod|coprod|lim|limsup|liminf|log|ln|exp|sin|cos|tan|cot|sec|csc|arcsin|arccos|arctan|sinh|cosh|tanh|begin|end|cap|cup|subset|subseteq|supset|supseteq|setminus|emptyset|varnothing|in|notin|ni|forall|exists|nexists|therefore|because|neg|lnot|wedge|vee|oplus|otimes|mapsto|to|rightarrow|Rightarrow|leftarrow|Leftarrow|leftrightarrow|Leftrightarrow|longrightarrow|implies|iff|partial|nabla|vec|hat|bar|dot|ddot|overline|underline|overrightarrow|widehat|widetilde|binom|choose|bmod|pmod|cdots|ldots|vdots|ddots|mathbb|mathcal|mathbf|mathrm|boxed)/g, '\\$1');

    // Fix double-escaped LaTeX special characters (\\{ \\} \\$ \\% \\& \\# \\_
    // -> \{ \} \$ \% \& \# \_). These are escaped punctuation, not command
    // words, so they need their own pattern separate from the whitelist above.
    // \$ and \% are especially important: an unescaped $ confuses the
    // markdown math-delimiter parser, and an unescaped % is a LaTeX comment
    // character that silently swallows the rest of the line.
    processed = processed.replace(/\\\\([{}$%&#_])/g, '\\$1');

    processed = processed.replace(/\n{3,}/g, '\n\n');

    // Simplify LaTeX digit-grouping braces used only for spacing (e.g. 2{,}000 -> 2,000)
    processed = processed.replace(/(\d)\{,\}(\d)/g, '$1,$2');

    // De-mathify simple currency amounts, e.g. $\$2,000$ or $$\$2,000$$.
    // A literal dollar sign for currency and $ as a math delimiter clash:
    // remark-math scans for the next raw "$" to close a math span and does
    // NOT respect the backslash in "\$", so it misreads the escaped currency
    // dollar as the closing delimiter and everything after it spills out as
    // broken unparsed text. These amounts have no real math content (no
    // fractions/exponents/variables) so there's nothing lost by rendering
    // them as plain text instead — pulling them out of math mode entirely
    // sidesteps the clash. &#36; (not a raw $) so it can never accidentally
    // pair up with another $ elsewhere in the document.
    processed = processed.replace(/\${1,2}\\\$(\s*[\d,.\s]+)\${1,2}/g, (_m, amount) => '&#36;' + amount.trim());

    // De-mathify simple percentages, e.g. $8\%$ or $$8\%$$, for the same reason.
    processed = processed.replace(/\${1,2}(\s*[\d.]+\s*)\\%\${1,2}/g, (_m, num) => num.trim() + '%');

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
