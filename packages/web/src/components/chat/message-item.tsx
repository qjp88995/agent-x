import type { ReasoningUIPart,UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';

import { cn } from '@/lib/utils';

import { MarkdownRenderer } from './markdown-renderer';
import { ThinkingBlock } from './thinking-block';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
    </div>
  );
}

function AssistantContent({ parts }: { readonly parts: UIMessage['parts'] }) {
  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === 'reasoning') {
          const rp = part as ReasoningUIPart;
          return (
            <ThinkingBlock
              key={`reasoning-${i}`}
              content={rp.text}
              done={rp.state === 'done'}
            />
          );
        }
        if (part.type === 'text') {
          const text = (part as { type: 'text'; text: string }).text;
          if (!text) return null;
          return <MarkdownRenderer key={`text-${i}`} content={text} />;
        }
        return null;
      })}
    </div>
  );
}

export function MessageItem({ message }: { readonly message: UIMessage }) {
  const isUser = message.role === 'user';
  const hasContent = message.parts.some(
    p =>
      (p.type === 'text' &&
        (p as { type: 'text'; text: string }).text.length > 0) ||
      p.type === 'reasoning'
  );
  const showTyping = !isUser && !hasContent;

  return (
    <div
      className={cn('flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground'
        )}
      >
        {showTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.parts
              .filter(
                (p): p is { type: 'text'; text: string } => p.type === 'text'
              )
              .map(p => p.text)
              .join('')}
          </p>
        ) : (
          <AssistantContent parts={message.parts} />
        )}
      </div>
    </div>
  );
}
