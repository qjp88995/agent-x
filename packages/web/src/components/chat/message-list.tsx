import { forwardRef } from 'react';

import type { UIMessage } from 'ai';

import { cn } from '@/lib/utils';

import { MessageItem } from './message-item';

interface MessageListProps {
  readonly messages: UIMessage[];
  readonly className?: string;
}

export const MessageList = forwardRef<HTMLDivElement, MessageListProps>(
  function MessageList({ messages, className }, ref) {
    return (
      <div className={cn('py-4', className)}>
        {messages.map(message => (
          <MessageItem key={message.id} message={message} />
        ))}
        <div ref={ref} />
      </div>
    );
  }
);
