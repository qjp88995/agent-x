import { memo, useCallback, useState } from 'react';
import Markdown from 'react-markdown';

import { Check, Copy } from 'lucide-react';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';

import 'highlight.js/styles/github-dark.min.css';

// Allow highlight.js class names through sanitization
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), 'className'],
    span: [...(defaultSchema.attributes?.span ?? []), 'className'],
  },
};

function CopyButton({ code }: { readonly code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may fail in non-HTTPS contexts or when permission denied
    }
  }, [code]);

  return (
    <button
      onClick={handleCopy}
      className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors"
    >
      {copied ? (
        <>
          <Check className="size-3" />
          <span>Copied</span>
        </>
      ) : (
        <>
          <Copy className="size-3" />
          <span>Copy</span>
        </>
      )}
    </button>
  );
}

export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  className,
}: {
  readonly content: string;
  readonly className?: string;
}) {
  return (
    <div className={cn('markdown-body text-sm leading-relaxed', className)}>
      <Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
        components={{
          pre({ children, ...props }) {
            // Extract code string from children for copy button
            const codeElement = Array.isArray(children)
              ? children[0]
              : children;
            const codeString =
              codeElement &&
              typeof codeElement === 'object' &&
              'props' in codeElement
                ? extractText(codeElement.props.children)
                : '';

            return (
              <div className="group relative my-3">
                <div className="bg-muted/50 flex items-center justify-end border-b px-2 py-1">
                  <CopyButton code={codeString} />
                </div>
                <pre
                  {...props}
                  className="overflow-x-auto rounded-b-lg p-4 text-[13px]"
                >
                  {children}
                </pre>
              </div>
            );
          },
          code({ className, children, ...props }) {
            const isBlock = className?.includes('hljs');
            if (isBlock) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code
                className="bg-muted rounded px-1.5 py-0.5 text-[13px]"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-2"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="my-3 overflow-x-auto">
                <table
                  className="border-border w-full border-collapse border text-sm"
                  {...props}
                >
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="bg-muted border-border border px-3 py-2 text-left font-semibold"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="border-border border px-3 py-2" {...props}>
                {children}
              </td>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="my-2 list-disc space-y-1 pl-6" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="my-2 list-decimal space-y-1 pl-6" {...props}>
                {children}
              </ol>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-muted-foreground/30 text-muted-foreground my-3 border-l-4 pl-4 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          h1({ children, ...props }) {
            return (
              <h1 className="mt-4 mb-2 text-xl font-bold" {...props}>
                {children}
              </h1>
            );
          },
          h2({ children, ...props }) {
            return (
              <h2 className="mt-3 mb-2 text-lg font-bold" {...props}>
                {children}
              </h2>
            );
          },
          h3({ children, ...props }) {
            return (
              <h3 className="mt-3 mb-1 text-base font-semibold" {...props}>
                {children}
              </h3>
            );
          },
          p({ children, ...props }) {
            return (
              <p className="my-2 leading-relaxed" {...props}>
                {children}
              </p>
            );
          },
          hr(props) {
            return <hr className="border-border my-4" {...props} />;
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
});

function extractText(node: unknown): string {
  if (typeof node === 'string') return node;
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (node && typeof node === 'object' && 'props' in node) {
    return extractText(
      (node as { props: { children: unknown } }).props.children
    );
  }
  return '';
}
