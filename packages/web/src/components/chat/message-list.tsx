import { forwardRef } from 'react';

import type { UIMessage } from 'ai';
import { Bot } from 'lucide-react';

import { cn } from '@/lib/utils';

import { MessageItem } from './message-item';

function TypingPlaceholder() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="bg-primary flex size-8 shrink-0 items-center justify-center rounded-full text-white">
        <Bot className="size-4" />
      </div>
      <div className="bg-card border-border/50 rounded-2xl border px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
          <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
          <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  readonly messages: UIMessage[];
  readonly className?: string;
  readonly showTyping?: boolean;
  readonly isStreaming?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, className, showTyping, isStreaming }, ref) {
    let lastAssistantIdx = -1;
    if (isStreaming) {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') {
          lastAssistantIdx = i;
          break;
        }
      }
    }

    return (
      <div className={cn('py-4', className)}>
        {messages.map((message, i) => (
          <MessageItem
            key={message.id}
            message={message}
            streaming={i === lastAssistantIdx}
          />
        ))}
        {showTyping && <TypingPlaceholder />}
        <div ref={ref} />
      </div>
    );
  }
);
