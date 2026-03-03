import { Bot, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/hooks/use-chat-stream';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
    </div>
  );
}

function MessageContent({ content }: { readonly content: string }) {
  const paragraphs = content.split('\n\n');

  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, idx) => {
        const lines = paragraph.split('\n');
        return (
          <p key={idx} className="text-sm leading-relaxed whitespace-pre-wrap">
            {lines.map((line, lineIdx) => (
              <span key={lineIdx}>
                {lineIdx > 0 && <br />}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}

export function MessageItem({ message }: { readonly message: ChatMessage }) {
  const isUser = message.role === 'user';
  const showTyping = message.isStreaming && !message.content;

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
            : 'bg-muted text-muted-foreground',
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
            : 'bg-muted text-foreground',
        )}
      >
        {showTyping ? (
          <TypingIndicator />
        ) : (
          <MessageContent content={message.content} />
        )}
      </div>
    </div>
  );
}
