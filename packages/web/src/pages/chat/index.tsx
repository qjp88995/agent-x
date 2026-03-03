import { useCallback,useEffect, useState } from 'react';
import { Link,useSearchParams } from 'react-router';

import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  ChevronDown,
  MessageSquare,
  Plus,
  Trash2,
} from 'lucide-react';

import { ChatPanel } from '@/components/chat/chat-panel';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useAgents } from '@/hooks/use-agents';
import {
  type ConversationWithAgent,
  useConversations,
  useCreateConversation,
  useDeleteConversation,
} from '@/hooks/use-chat';
import { cn } from '@/lib/utils';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function ConversationItem({
  conversation,
  isActive,
  onSelect,
  onDelete,
}: {
  readonly conversation: ConversationWithAgent;
  readonly isActive: boolean;
  readonly onSelect: () => void;
  readonly onDelete: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground'
          : 'hover:bg-accent/50 text-foreground/80'
      )}
    >
      <MessageSquare className="mt-0.5 size-4 shrink-0 opacity-60" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {conversation.title ?? 'New Chat'}
        </p>
        <p className="text-muted-foreground mt-0.5 truncate text-xs">
          {conversation.agent.name} &middot;{' '}
          {formatDate(conversation.updatedAt)}
        </p>
      </div>
      <button
        type="button"
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
        className="text-muted-foreground hover:text-destructive mt-0.5 hidden shrink-0 rounded p-0.5 group-hover:block"
        aria-label="Delete conversation"
      >
        <Trash2 className="size-3.5" />
      </button>
    </button>
  );
}

function Sidebar({
  conversations,
  activeConversationId,
  selectedAgentId,
  agents,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  onSelectAgent,
}: {
  readonly conversations: ConversationWithAgent[];
  readonly activeConversationId: string | null;
  readonly selectedAgentId: string | null;
  readonly agents: Array<{
    readonly id: string;
    readonly name: string;
    readonly status: string;
  }>;
  readonly onSelectConversation: (id: string) => void;
  readonly onDeleteConversation: (id: string) => void;
  readonly onNewChat: () => void;
  readonly onSelectAgent: (id: string) => void;
}) {
  const publishedAgents = agents.filter(a => a.status === 'PUBLISHED');
  const selectedAgent = publishedAgents.find(a => a.id === selectedAgentId);
  const filteredConversations = selectedAgentId
    ? conversations.filter(c => c.agentId === selectedAgentId)
    : conversations;

  return (
    <div className="flex h-full w-72 flex-col border-r bg-background">
      {/* Back to dashboard + title */}
      <div className="flex h-14 items-center gap-2 px-4">
        <Button variant="ghost" size="icon" className="size-8" asChild>
          <Link to="/agents">
            <ArrowLeft className="size-4" />
            <span className="sr-only">Back to dashboard</span>
          </Link>
        </Button>
        <span className="text-lg font-bold tracking-tight">Chat</span>
      </div>
      <Separator />

      {/* Agent selector */}
      <div className="p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between"
              size="sm"
            >
              <span className="flex items-center gap-2 truncate">
                <Bot className="size-4 shrink-0" />
                <span className="truncate">
                  {selectedAgent?.name ?? 'All Agents'}
                </span>
              </span>
              <ChevronDown className="size-3.5 shrink-0 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64" align="start">
            <DropdownMenuItem onClick={() => onSelectAgent('')}>
              All Agents
            </DropdownMenuItem>
            {publishedAgents.map(agent => (
              <DropdownMenuItem
                key={agent.id}
                onClick={() => onSelectAgent(agent.id)}
              >
                {agent.name}
              </DropdownMenuItem>
            ))}
            {publishedAgents.length === 0 && (
              <div className="text-muted-foreground px-2 py-1.5 text-sm">
                No published agents
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* New chat button */}
      <div className="px-3 pb-2">
        <Button
          className="w-full"
          size="sm"
          onClick={onNewChat}
          disabled={!selectedAgentId}
        >
          <Plus className="mr-2 size-4" />
          New Chat
        </Button>
      </div>

      <Separator />

      {/* Conversation list */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {filteredConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8">
              <MessageSquare className="text-muted-foreground mb-2 size-8 opacity-40" />
              <p className="text-muted-foreground text-xs">
                {selectedAgentId
                  ? 'No conversations yet'
                  : 'Select an agent to start'}
              </p>
            </div>
          )}
          {filteredConversations.map(conv => (
            <ConversationItem
              key={conv.id}
              conversation={conv}
              isActive={conv.id === activeConversationId}
              onSelect={() => onSelectConversation(conv.id)}
              onDelete={() => onDeleteConversation(conv.id)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

function NoChatSelected() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <MessageSquare className="text-muted-foreground size-8" />
      </div>
      <div className="text-center">
        <h3 className="text-lg font-semibold">Select a conversation</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Choose an existing conversation or start a new one.
        </p>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const agentParam = searchParams.get('agent');
  const conversationParam = searchParams.get('conversation');

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(
    agentParam
  );
  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(conversationParam);

  const {
    data: conversations,
    isLoading: conversationsLoading,
    error: conversationsError,
  } = useConversations();
  const { data: agents } = useAgents();
  const createConversation = useCreateConversation();
  const deleteConversation = useDeleteConversation();

  // Sync URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAgentId) params.set('agent', selectedAgentId);
    if (activeConversationId) params.set('conversation', activeConversationId);
    setSearchParams(params, { replace: true });
  }, [selectedAgentId, activeConversationId, setSearchParams]);

  const handleSelectAgent = useCallback((agentId: string) => {
    setSelectedAgentId(agentId || null);
    setActiveConversationId(null);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
  }, []);

  const handleDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation.mutate(id, {
        onSuccess: () => {
          if (activeConversationId === id) {
            setActiveConversationId(null);
          }
        },
      });
    },
    [deleteConversation, activeConversationId]
  );

  const handleNewChat = useCallback(() => {
    if (!selectedAgentId) return;

    createConversation.mutate(
      { agentId: selectedAgentId },
      {
        onSuccess: data => {
          setActiveConversationId(data.id);
        },
      }
    );
  }, [selectedAgentId, createConversation]);

  // Find the active conversation's agent name
  const activeConversation = conversations?.find(
    c => c.id === activeConversationId
  );
  const agentName = activeConversation?.agent.name ?? 'Assistant';

  if (conversationsError) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="text-destructive size-10" />
          <p className="text-muted-foreground">Failed to load conversations</p>
          <Button variant="outline" asChild>
            <Link to="/agents">Back to Dashboard</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        conversations={conversations ?? []}
        activeConversationId={activeConversationId}
        selectedAgentId={selectedAgentId}
        agents={agents ?? []}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onNewChat={handleNewChat}
        onSelectAgent={handleSelectAgent}
      />

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {conversationsLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground text-sm">Loading...</p>
          </div>
        ) : activeConversationId ? (
          <ChatPanel
            key={activeConversationId}
            conversationId={activeConversationId}
            agentName={agentName}
          />
        ) : (
          <NoChatSelected />
        )}
      </div>
    </div>
  );
}
