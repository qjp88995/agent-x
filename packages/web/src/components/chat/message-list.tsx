import { forwardRef } from 'react';

import { MessageBubble } from '@agent-x/design';
import type { UIMessage } from 'ai';

import { cn } from '@/lib/utils';

import { MessageItem } from './message-item';

function TypingPlaceholder() {
  return (
    <MessageBubble
      role="assistant"
      avatar={{ name: 'Agent-X' }}
      className="px-4 py-3"
    >
      <div className="flex items-center gap-1">
        <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
        <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
        <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
      </div>
    </MessageBubble>
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
