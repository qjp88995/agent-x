import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ErrorState,
  LoadingState,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import {
  ArrowLeft,
  Bot,
  ChevronDown,
  Code2,
  MessageSquare,
  Plus,
} from 'lucide-react';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatPanel } from '@/components/chat/chat-panel';
import { ChatShell } from '@/components/chat/chat-shell';
import { AppCommandPalette } from '@/components/shared/app-command-palette';
import { WorkspaceApiProvider } from '@/contexts/workspace-api-context';
import { useAgents } from '@/hooks/use-agents';
import {
  useConversations,
  useCreateConversation,
  useDeleteConversation,
  useRenameConversation,
} from '@/hooks/use-chat';
import { useWorkspaceFiles } from '@/hooks/use-workspace';
import { api } from '@/lib/api';
import type { ChatConversation } from '@/lib/chat-types';

function ChatPageContent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
  const renameConversation = useRenameConversation();
  const deleteConversation = useDeleteConversation();

  const publishedAgents = useMemo(
    () => (agents ?? []).filter(a => a.status === 'ACTIVE'),
    [agents]
  );
  const selectedAgent = publishedAgents.find(a => a.id === selectedAgentId);

  // Map to ChatConversation[], filtered by selected agent
  const mappedConversations: ChatConversation[] = useMemo(
    () =>
      (conversations ?? [])
        .filter(c => !selectedAgentId || c.agentId === selectedAgentId)
        .map(c => ({
          id: c.id,
          title: c.title,
          updatedAt: c.updatedAt,
          agentName: c.agent.name,
        })),
    [conversations, selectedAgentId]
  );

  // Active conversation metadata
  const activeConversation = conversations?.find(
    c => c.id === activeConversationId
  );
  const agentName = activeConversation?.agent.name ?? 'Assistant';

  // Workspace files for chat header workspace button
  const { data: workspaceFiles } = useWorkspaceFiles(
    activeConversationId ?? undefined
  );
  const hasFiles = workspaceFiles && workspaceFiles.length > 0;

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

  const handleRenameConversation = useCallback(
    (id: string, title: string) => {
      renameConversation.mutate({ id, title });
    },
    [renameConversation]
  );

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

  if (conversationsError) {
    return (
      <ErrorState
        title={t('chat.failedToLoadConversations')}
        description={t('chat.failedToLoadConversations')}
        actionLabel={t('chat.backToDashboard')}
        onAction={() => void navigate('/agents')}
        className="h-screen"
      />
    );
  }

  return (
    <>
      <AppCommandPalette />
      <ChatShell
        sidebarHeader={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" asChild>
                  <Link to="/agents">
                    <ArrowLeft className="size-4" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('chat.backToDashboard')}</TooltipContent>
            </Tooltip>
            <span className="text-primary text-sm font-semibold">
              {t('chat.title')}
            </span>
          </>
        }
        sidebarActions={
          <>
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
                      {selectedAgent?.name ?? t('chat.allAgents')}
                    </span>
                  </span>
                  <ChevronDown className="size-3.5 shrink-0 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64" align="start">
                <DropdownMenuItem onClick={() => handleSelectAgent('')}>
                  {t('chat.allAgents')}
                </DropdownMenuItem>
                {publishedAgents.map(agent => (
                  <DropdownMenuItem
                    key={agent.id}
                    onClick={() => handleSelectAgent(agent.id)}
                    className="cursor-pointer"
                  >
                    {agent.name}
                  </DropdownMenuItem>
                ))}
                {publishedAgents.length === 0 && (
                  <div className="text-foreground-muted px-2 py-1.5 text-sm">
                    {t('chat.noAgentsAvailable')}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="primary"
              className="w-full"
              size="sm"
              onClick={handleNewChat}
              disabled={!selectedAgentId}
            >
              <Plus className="mr-2 size-4" />
              {t('chat.newChat')}
            </Button>
          </>
        }
        conversations={mappedConversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        chatHeader={
          activeConversationId ? (
            <>
              <MessageSquare className="text-primary size-5" />
              <h2 className="truncate text-sm font-semibold">
                {activeConversation?.title ?? agentName}
              </h2>
              {hasFiles && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="ml-auto size-8"
                      asChild
                    >
                      <Link to={`/chat/${activeConversationId}/workspace`}>
                        <Code2 className="size-4" />
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('workspace.openIde')}</TooltipContent>
                </Tooltip>
              )}
            </>
          ) : undefined
        }
      >
        {conversationsLoading ? (
          <LoadingState message={t('common.loading')} className="flex-1" />
        ) : activeConversationId ? (
          <ChatPanel
            key={activeConversationId}
            conversationId={activeConversationId}
            agentName={agentName}
            title={activeConversation?.title ?? undefined}
            hideHeader
          />
        ) : (
          <ChatEmptyState />
        )}
      </ChatShell>
    </>
  );
}

export default function ChatPage() {
  const filesUrl = (id: string) => `/conversations/${id}/files`;

  return (
    <WorkspaceApiProvider
      client={api}
      filesUrl={filesUrl}
      downloadUrl={(id: string, fileId: string) =>
        `/api${filesUrl(id)}/${fileId}/download`
      }
    >
      <ChatPageContent />
    </WorkspaceApiProvider>
  );
}
