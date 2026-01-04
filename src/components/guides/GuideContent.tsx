import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

interface GuideContentProps {
  content: string;
}

export function GuideContent({ content }: GuideContentProps) {
  const components: Components = {
    h1: ({ children }) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 first:mt-0">{children}</h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-2xl font-semibold mt-8 mb-3">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-xl font-semibold mt-6 mb-2">{children}</h3>
    ),
    p: ({ children }) => (
      <p className="text-muted-foreground leading-relaxed mb-4">{children}</p>
    ),
    ul: ({ children }) => (
      <ul className="list-disc list-inside mb-4 space-y-1 text-muted-foreground">{children}</ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-4 space-y-1 text-muted-foreground">{children}</ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary hover:underline"
        target={href?.startsWith('http') ? '_blank' : undefined}
        rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      >
        {children}
      </a>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
        {children}
      </code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted p-4 rounded-lg overflow-x-auto mb-4">
        {children}
      </pre>
    ),
    img: ({ src, alt }) => (
      <img
        src={src}
        alt={alt}
        className="rounded-lg my-4 max-w-full h-auto"
        loading="lazy"
      />
    ),
    hr: () => <hr className="my-8 border-border" />,
  };

  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </article>
  );
}
