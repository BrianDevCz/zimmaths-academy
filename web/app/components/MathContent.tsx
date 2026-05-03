import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MathContent({ children }: { children: string }) {
  if (!children) return null;

  const processContent = (content: string) => {
    if (!content) return '';

    // Decode HTML entities first — fixes &lt; &gt; &amp; &quot; saved incorrectly
    let processed = content
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&le;/g, '\\leq')
      .replace(/&ge;/g, '\\geq')
      .replace(/&ne;/g, '\\neq');

    // Convert \(...\) to $...$ (inline math)
    processed = processed.replace(/\\\(/g, '$').replace(/\\\)/g, '$');

    // Convert \[...\] to $$...$$ (display math)
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');

    return processed;
  };

  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {processContent(children)}
    </ReactMarkdown>
  );
}
