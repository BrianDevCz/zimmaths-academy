import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MathContent({ children }: { children: string }) {
  if (!children) return null;

  // Process the content to ensure LaTeX delimiters are correct
  const processContent = (content: string) => {
    if (!content) return '';
    
    // Convert \(...\) to $...$ (for inline math)
    let processed = content.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    
    // Convert \[...\] to $$...$$ (for display math)
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