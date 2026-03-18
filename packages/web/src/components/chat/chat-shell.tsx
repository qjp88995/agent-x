import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@agent-x/design';
import { Menu } from 'lucide-react';

import type { ChatConversation } from '@/lib/chat-types';

import { ChatSidebar } from './chat-sidebar';

interface ChatShellProps {
  /** Sidebar top: back button + title or agent info */
  readonly sidebarHeader: React.ReactNode;
  /** Sidebar actions: agent selector + new chat button */
  readonly sidebarActions?: React.ReactNode;
  /** Sidebar bottom: branding footer */
  readonly sidebarFooter?: React.ReactNode;
  /** Mobile sheet title for accessibility */
  readonly sidebarTitle?: string;
  readonly conversations: readonly ChatConversation[];
  readonly activeConversationId: string | null;
  readonly onSelectConversation: (id: string) => void;
  readonly onDeleteConversation: (id: string) => void;
  readonly onRenameConversation: (id: string, title: string) => void;
  /** Chat header content (title, workspace button, etc.) */
  readonly chatHeader?: React.ReactNode;
  /** Main content area */
  readonly children: React.ReactNode;
}

export function ChatShell({
  sidebarHeader,
  sidebarActions,
  sidebarFooter,
  sidebarTitle,
  conversations,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onRenameConversation,
  chatHeader,
  children,
}: ChatShellProps) {
  const { t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectConversation = (id: string) => {
    onSelectConversation(id);
    setSidebarOpen(false);
  };

  const sidebarProps = {
    header: sidebarHeader,
    actions: sidebarActions,
    footer: sidebarFooter,
    conversations,
    activeConversationId,
    onSelectConversation: handleSelectConversation,
    onDeleteConversation,
    onRenameConversation,
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Desktop sidebar */}
      <div className="hidden shrink-0 md:flex">
        <ChatSidebar {...sidebarProps} />
      </div>

      {/* Mobile sidebar drawer */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-(--chat-sidebar) p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{sidebarTitle ?? t('chat.title')}</SheetTitle>
          </SheetHeader>
          <ChatSidebar {...sidebarProps} />
        </SheetContent>
      </Sheet>

      {/* Main chat area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Chat header */}
        <div className="flex h-12 shrink-0 items-center gap-3 border-b px-4">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label={t('nav.openMenu')}
          >
            <Menu className="size-5" />
          </Button>
          {chatHeader}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}
