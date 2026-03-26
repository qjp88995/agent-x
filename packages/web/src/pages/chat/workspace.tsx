import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import {
  Button,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import { ArrowLeft, Download, FileCode2, MessageSquare } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { WorkspaceContainer } from '@/components/workspace/workspace-container';
import { WorkspaceApiProvider } from '@/contexts/workspace-api-context';
import { messagesKey, useConversations, useMessages } from '@/hooks/use-chat';
import { useChatStream } from '@/hooks/use-chat-stream';
import { useDownloadWorkspace, useWorkspaceFiles } from '@/hooks/use-workspace';
import { useWorkspaceSync } from '@/hooks/use-workspace-sync';
import { api } from '@/lib/api';
import { AgentXChatTransport } from '@/lib/chat-transport';
import { cn } from '@/lib/utils';

function WorkspacePageContent({
  conversationId,
}: {
  readonly conversationId: string;
}) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'workspace' | 'chat'>('workspace');

  const transport = useMemo(
    () => new AgentXChatTransport(conversationId),
    [conversationId]
  );

  const { data: savedMessages } = useMessages(conversationId);

  const { messages, sendMessage, handleStop, isLoading } = useChatStream({
    conversationId,
    transport,
    savedMessages,
    messagesQueryKey: messagesKey(conversationId),
  });

  useWorkspaceSync(conversationId, messages);

  const { data: conversations } = useConversations();
  const conversationTitle = conversations?.find(
    c => c.id === conversationId
  )?.title;

  const { data: workspaceFiles } = useWorkspaceFiles(conversationId);
  const downloadWorkspace = useDownloadWorkspace();

  const handleDownloadWorkspace = useCallback(() => {
    downloadWorkspace.mutate(conversationId);
  }, [conversationId, downloadWorkspace]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (content: string) => {
    void sendMessage({ text: content });
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* Header */}
      <div className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <Link to={`/chat?conversation=${conversationId}`}>
                <ArrowLeft className="size-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('workspace.backToChat')}</TooltipContent>
        </Tooltip>
        <span className="text-primary shrink-0 font-semibold">
          {t('workspace.title')}
        </span>
        {conversationTitle && (
          <>
            <span className="text-foreground-muted hidden md:inline">·</span>
            <span className="hidden truncate text-sm text-foreground-muted md:inline">
              {conversationTitle}
            </span>
          </>
        )}
        <div className="ml-auto shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                onClick={handleDownloadWorkspace}
                disabled={!workspaceFiles || workspaceFiles.length === 0}
              >
                <Download className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('workspace.downloadZip')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="flex shrink-0 border-b md:hidden">
        <button
          type="button"
          onClick={() => setActiveTab('workspace')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'workspace'
              ? 'border-b-2 border-primary text-primary'
              : 'text-foreground-muted hover:text-foreground'
          )}
        >
          <FileCode2 className="size-4" />
          {t('workspace.title')}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('chat')}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors',
            activeTab === 'chat'
              ? 'border-b-2 border-primary text-primary'
              : 'text-foreground-muted hover:text-foreground'
          )}
        >
          <MessageSquare className="size-4" />
          {t('chat.title')}
        </button>
      </div>

      {/* Mobile content */}
      <div className="flex flex-1 overflow-hidden md:hidden">
        <div
          className={cn('h-full w-full', activeTab !== 'workspace' && 'hidden')}
        >
          <WorkspaceContainer conversationId={conversationId} />
        </div>
        <div
          className={cn(
            'flex h-full w-full flex-col',
            activeTab !== 'chat' && 'hidden'
          )}
        >
          <div className="flex-1 overflow-y-auto">
            <MessageList
              ref={messagesEndRef}
              messages={messages}
              className="mx-auto max-w-full px-2"
              isStreaming={isLoading}
              showTyping={
                isLoading &&
                messages.length > 0 &&
                messages[messages.length - 1].role === 'user'
              }
            />
          </div>
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Desktop: resizable split layout */}
      <div className="hidden min-h-0 flex-1 overflow-hidden md:flex">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel defaultSize="60%" minSize="30%">
            <WorkspaceContainer conversationId={conversationId} />
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize="40%" minSize="20%">
            <div className="flex h-full flex-col">
              <div className="flex-1 overflow-y-auto">
                <MessageList
                  ref={messagesEndRef}
                  messages={messages}
                  className="mx-auto max-w-full px-2"
                  isStreaming={isLoading}
                  showTyping={
                    isLoading &&
                    messages.length > 0 &&
                    messages[messages.length - 1].role === 'user'
                  }
                />
              </div>
              <ChatInput
                onSend={handleSend}
                onStop={handleStop}
                isLoading={isLoading}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

export default function WorkspacePage() {
  const { conversationId } = useParams<{ conversationId: string }>();

  if (!conversationId) return null;

  const filesUrl = (id: string) => `/conversations/${id}/files`;

  return (
    <WorkspaceApiProvider
      client={api}
      filesUrl={filesUrl}
      downloadUrl={(id: string, fileId: string) =>
        `/api${filesUrl(id)}/${fileId}/download`
      }
    >
      <WorkspacePageContent conversationId={conversationId} />
    </WorkspaceApiProvider>
  );
}
