import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MathContent({ children }: { children: string }) {
  if (!children) return null;

  const processContent = (content: string) => {
    if (!content) return '';
    
    // Convert \(...\) to $...$ (for inline math)
    let processed = content.replace(/\\\(/g, '$').replace(/\\\)/g, '$');
    
    // Convert \[...\] to $$...$$ (for display math)
    processed = processed.replace(/\\\[/g, '$$').replace(/\\\]/g, '$$');
    
    // Add spacing before question parts — only outside math mode
    // Match (a), (b), (c) preceded by period + space or at start of text
    processed = processed.replace(/(\.\s*|^\s*)\(([a-e])\)/gm, '$1<br><br>($2)');
    // Match (i), (ii), (iii), (iv) sub-parts preceded by period + space
    processed = processed.replace(/(\.\s*)\(([ivx]+)\)/g, '$1<br>($2)');
    
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