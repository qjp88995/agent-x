import { useTranslation } from 'react-i18next';

import type { UIMessage } from 'ai';
import { ArrowLeft } from 'lucide-react';

import { ChatInput } from '@/components/chat/chat-input';
import { MessageList } from '@/components/chat/message-list';
import { Button } from '@/components/ui/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { WorkspacePanel } from './workspace-panel';

interface IdeLayoutProps {
  readonly conversationId: string;
  readonly messages: UIMessage[];
  readonly messagesEndRef: React.RefObject<HTMLDivElement | null>;
  readonly isLoading: boolean;
  readonly onSend: (content: string) => void;
  readonly onStop: () => void;
  readonly onBackToChat: () => void;
}

export function IdeLayout({
  conversationId,
  messages,
  messagesEndRef,
  isLoading,
  onSend,
  onStop,
  onBackToChat,
}: IdeLayoutProps) {
  const { t } = useTranslation();

  return (
    <div className="flex h-full flex-col">
      {/* IDE Header */}
      <div className="flex h-10 shrink-0 items-center gap-2 border-b px-3">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 cursor-pointer"
              onClick={onBackToChat}
            >
              <ArrowLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('workspace.backToChat')}</TooltipContent>
        </Tooltip>
        <span className="gradient-text text-sm font-semibold">
          {t('workspace.title')}
        </span>
      </div>

      {/* IDE Content */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        {/* Workspace panel (file tree + editor) */}
        <ResizablePanel defaultSize="60%" minSize="30%">
          <WorkspacePanel conversationId={conversationId} />
        </ResizablePanel>

        <ResizableHandle withHandle />

        {/* Chat panel */}
        <ResizablePanel defaultSize="40%" minSize="25%">
          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto">
              <MessageList
                ref={messagesEndRef}
                messages={messages}
                className="mx-auto max-w-full px-2"
                showTyping={
                  isLoading &&
                  messages.length > 0 &&
                  messages[messages.length - 1].role === 'user'
                }
              />
            </div>
            <ChatInput onSend={onSend} onStop={onStop} isLoading={isLoading} />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
