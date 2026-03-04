import { useState } from 'react';

import type {
  MessageResponse,
  SharedConversationResponse,
} from '@agent-x/shared';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, Bot, MessageSquare, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useSharedConversationMessages,
  useSharedConversations,
} from '@/hooks/use-shared-conversations';
import { cn } from '@/lib/utils';

interface ConversationsTabProps {
  agentId: string;
}

function MessageBubble({ message }: { message: MessageResponse }) {
  const isUser = message.role === 'user';

  const textContent = message.parts
    .filter(p => p.type === 'text')
    .map(p => (p as { type: 'text'; text: string }).text)
    .join('\n');

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>
      <div
        className={cn(
          'max-w-[80%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted'
        )}
      >
        <p className="whitespace-pre-wrap">{textContent}</p>
      </div>
    </div>
  );
}

function ConversationDetail({
  agentId,
  conversation,
  onBack,
}: {
  agentId: string;
  conversation: SharedConversationResponse;
  onBack: () => void;
}) {
  const { data: messages, isLoading } = useSharedConversationMessages(
    agentId,
    conversation.id
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h3 className="text-sm font-medium">
            {conversation.title ?? 'Untitled conversation'}
          </h3>
          <p className="text-muted-foreground text-xs">
            {conversation.shareToken?.name && (
              <span>via {conversation.shareToken.name} · </span>
            )}
            {conversation.agentVersion && (
              <span>v{conversation.agentVersion.version} · </span>
            )}
            {formatDistanceToNow(new Date(conversation.updatedAt), {
              addSuffix: true,
            })}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          Loading messages...
        </div>
      ) : !messages?.length ? (
        <div className="text-muted-foreground py-8 text-center text-sm">
          No messages in this conversation.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map(msg => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ConversationsTab({ agentId }: ConversationsTabProps) {
  const { data: conversations, isLoading } = useSharedConversations(agentId);
  const [selectedConversation, setSelectedConversation] =
    useState<SharedConversationResponse | null>(null);

  if (isLoading) {
    return (
      <Card className="max-w-4xl">
        <CardContent className="py-8">
          <div className="text-muted-foreground text-center text-sm">
            Loading...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader>
        <CardTitle>Conversations</CardTitle>
        <CardDescription>View conversations from shared links.</CardDescription>
      </CardHeader>
      <CardContent>
        {selectedConversation ? (
          <ConversationDetail
            agentId={agentId}
            conversation={selectedConversation}
            onBack={() => setSelectedConversation(null)}
          />
        ) : !conversations?.length ? (
          <div className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              No conversations yet.
            </p>
            <p className="text-muted-foreground mt-1 text-xs">
              Conversations will appear here when users chat via share links.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {conversations.map(conv => (
              <button
                key={conv.id}
                type="button"
                className="hover:bg-muted/50 flex items-center justify-between rounded-md border px-4 py-3 text-left transition-colors"
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">
                    {conv.title ?? 'Untitled conversation'}
                  </span>
                  <div className="text-muted-foreground flex items-center gap-2 text-xs">
                    {conv.agentVersion && (
                      <span>v{conv.agentVersion.version}</span>
                    )}
                    {conv.shareToken && <span>via {conv.shareToken.name}</span>}
                    <span>
                      {formatDistanceToNow(new Date(conv.updatedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
                <div className="text-muted-foreground flex items-center gap-1 text-sm">
                  <MessageSquare className="size-3.5" />
                  <span>{conv._count.messages}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
