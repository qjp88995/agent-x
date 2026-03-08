import { forwardRef } from 'react';

import type { UIMessage } from 'ai';
import { Bot } from 'lucide-react';

import { cn } from '@/lib/utils';

import { MessageItem } from './message-item';

function TypingPlaceholder() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="gradient-bg flex size-8 shrink-0 items-center justify-center rounded-full text-white">
        <Bot className="size-4" />
      </div>
      <div className="bg-card border-border/50 rounded-2xl border px-4 py-2.5">
        <div className="flex items-center gap-1">
          <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
          <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
          <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  );
}

interface MessageListProps {
  readonly messages: UIMessage[];
  readonly className?: string;
  readonly showTyping?: boolean;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, className, showTyping }, ref) {
    return (
      <div className={cn('py-4', className)}>
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        {showTyping && <TypingPlaceholder />}
        <div ref={ref} />
      </div>
    );
  }
);
