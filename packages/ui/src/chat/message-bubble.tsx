import * as React from 'react';

import { Check,Copy } from 'lucide-react';

import { cn } from '../lib/utils';
import { Avatar } from '../primitives/avatar';

type MessageBubbleProps = {
  role: 'user' | 'assistant';
  avatar?: { name: string; color?: string; src?: string };
  streaming?: boolean;
  children: React.ReactNode;
  className?: string;
};

function CodeBlock({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [copied, setCopied] = React.useState(false);

  const language = React.useMemo(() => {
    if (typeof className === 'string') {
      const match = /language-(\w+)/.exec(className);
      return match ? match[1] : null;
    }
    return null;
  }, [className]);

  const textContent = React.useMemo(() => {
    const extractText = (node: React.ReactNode): string => {
      if (typeof node === 'string') return node;
      if (typeof node === 'number') return String(node);
      if (Array.isArray(node)) return node.map(extractText).join('');
      if (React.isValidElement(node)) {
        return extractText(
          (node.props as { children?: React.ReactNode }).children
        );
      }
      return '';
    };
    return extractText(children);
  }, [children]);

  const handleCopy = React.useCallback(() => {
    void navigator.clipboard.writeText(textContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [textContent]);

  return (
    <div className="relative my-2 rounded-md overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-border">
        <span className="text-[10px] text-foreground-ghost font-mono">
          {language ?? 'code'}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-foreground-muted hover:text-foreground-secondary transition-colors"
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
      </div>
      <pre className="overflow-x-auto px-3 py-2.5 text-[12px] text-foreground-secondary font-mono leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function MessageBubble({
  role,
  avatar,
  streaming,
  children,
  className,
}: MessageBubbleProps) {
  if (role === 'user') {
    return (
      <div className={cn('flex justify-end', className)}>
        <div className="max-w-3/4 rounded-xl rounded-br-xs bg-surface border border-border px-3.5 py-2.5 text-[13px] text-foreground-secondary leading-relaxed">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex gap-2.5', className)}>
      {avatar && (
        <Avatar
          name={avatar.name}
          src={avatar.src}
          size="md"
          className="shrink-0 mt-0.5"
        />
      )}
      <div className="flex-1 min-w-0 max-w-3/4 text-[13px] text-foreground-secondary leading-relaxed">
        {children}
        {streaming && (
          <span className="inline-flex items-center gap-1 ml-1 align-middle">
            <span className="size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-foreground-ghost tracking-widest">···</span>
          </span>
        )}
      </div>
    </div>
  );
}

export { CodeBlock,MessageBubble };
