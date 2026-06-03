import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { cn } from '@/utils/cn';
import { normalizeMarkdown } from '@/utils/normalizeMarkdown';

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h1 className="text-base font-bold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-base font-semibold text-slate-900 mt-4 mb-2 first:mt-0">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-sm font-semibold text-slate-900 mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  p: ({ children }) => (
    <p className="text-sm text-slate-800 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 space-y-1 text-sm text-slate-800">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 space-y-1 text-sm text-slate-800">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed pl-0.5">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-slate-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic text-slate-700">{children}</em>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:text-primary-dark"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-primary-200 pl-3 my-2 text-slate-700 italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-');
    if (isBlock) {
      return (
        <code className="block text-xs bg-slate-100 rounded-md p-3 overflow-x-auto my-2 font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className="text-xs bg-slate-100 rounded px-1 py-0.5 font-mono text-slate-800">
        {children}
      </code>
    );
  },
  hr: () => <hr className="my-4 border-border" />,
};

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const normalized = normalizeMarkdown(content);

  return (
    <div className={cn('markdown-content break-words', className)}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
