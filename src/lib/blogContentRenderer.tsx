import ReactMarkdown from 'react-markdown';
import DOMPurify from 'dompurify';

// Configure DOMPurify to allow table elements
const purifyConfig = {
  ADD_TAGS: ['table', 'thead', 'tbody', 'tr', 'th', 'td'],
  ADD_ATTR: ['align', 'style', 'class'],
};

// Check if content contains Markdown tables
const hasMarkdownTables = (content: string): boolean => {
  // Match Markdown table pattern: | text | text | followed by | --- | --- |
  return /\|.+\|[\r\n]+\|[\s:|-]+\|/.test(content);
};

// Custom components for ReactMarkdown table rendering
const markdownComponents = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="blog-table-wrapper overflow-x-auto my-6 rounded-lg border border-border">
      <table className="blog-table w-full border-collapse min-w-full">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-muted">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors">
      {children}
    </tr>
  ),
  th: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <th 
      className="px-4 py-3 text-left font-semibold text-foreground border-r border-border last:border-r-0"
      style={style}
    >
      {children}
    </th>
  ),
  td: ({ children, style }: { children?: React.ReactNode; style?: React.CSSProperties }) => (
    <td 
      className="px-4 py-3 text-foreground border-r border-border last:border-r-0"
      style={style}
    >
      {children}
    </td>
  ),
  // Pass through other elements normally
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="my-4 leading-relaxed">{children}</p>
  ),
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-3xl font-bold mt-8 mb-4">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-2xl font-bold mt-6 mb-3">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-xl font-semibold mt-5 mb-2">{children}</h3>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc pl-6 my-4 space-y-2">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal pl-6 my-4 space-y-2">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{children}</li>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-4 border-primary pl-4 my-4 italic text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
          {children}
        </code>
      );
    }
    return (
      <code className={className}>{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm">
      {children}
    </pre>
  ),
  a: ({ children, href }: { children?: React.ReactNode; href?: string }) => (
    <a 
      href={href} 
      className="text-primary underline hover:opacity-80 transition-opacity"
      target={href?.startsWith('http') ? '_blank' : undefined}
      rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
    >
      {children}
    </a>
  ),
  img: ({ src, alt }: { src?: string; alt?: string }) => (
    <img 
      src={src} 
      alt={alt || ''} 
      className="rounded-lg my-6 max-w-full h-auto"
      loading="lazy"
    />
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic">{children}</em>
  ),
};

interface BlogContentRendererProps {
  content: string;
  className?: string;
}

export function BlogContentRenderer({ content, className = '' }: BlogContentRendererProps) {
  // Check if content has Markdown tables
  const useMarkdown = hasMarkdownTables(content);

  if (useMarkdown) {
    return (
      <div className={`blog-content ${className}`}>
        <ReactMarkdown components={markdownComponents}>
          {content}
        </ReactMarkdown>
      </div>
    );
  }

  // Fallback to HTML rendering for legacy content
  return (
    <div
      className={`prose prose-lg dark:prose-invert max-w-none ${className}`}
      dangerouslySetInnerHTML={{
        __html: DOMPurify.sanitize(content, purifyConfig),
      }}
    />
  );
}

export default BlogContentRenderer;
