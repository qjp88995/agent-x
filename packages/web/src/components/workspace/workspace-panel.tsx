import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import { Download, FolderTree } from 'lucide-react';

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
import {
  useDownloadFile,
  useDownloadWorkspace,
  useWorkspaceFiles,
} from '@/hooks/use-workspace';

import { FileEditor, type OpenTab } from './file-editor';
import { FileTree } from './file-tree';

interface WorkspacePanelProps {
  readonly conversationId: string;
}

export function WorkspacePanel({ conversationId }: WorkspacePanelProps) {
  const { t } = useTranslation();
  const { data: files } = useWorkspaceFiles(conversationId);
  const downloadWorkspace = useDownloadWorkspace();
  const downloadFile = useDownloadFile();

  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | undefined>();

  const handleSelectFile = useCallback((file: WorkspaceFileResponse) => {
    setOpenTabs(prev => {
      if (prev.some(tab => tab.file.id === file.id)) return prev;
      return [...prev, { file, modified: false }];
    });
    setActiveFileId(file.id);
  }, []);

  const handleCloseTab = useCallback(
    (fileId: string) => {
      setOpenTabs(prev => {
        const next = prev.filter(tab => tab.file.id !== fileId);
        if (activeFileId === fileId) {
          setActiveFileId(
            next.length > 0 ? next[next.length - 1].file.id : undefined
          );
        }
        return next;
      });
    },
    [activeFileId]
  );

  const handleTabModified = useCallback((fileId: string, modified: boolean) => {
    setOpenTabs(prev =>
      prev.map(tab => (tab.file.id === fileId ? { ...tab, modified } : tab))
    );
  }, []);

  const handleDownloadFile = useCallback(
    (file: WorkspaceFileResponse) => {
      downloadFile.mutate({
        conversationId,
        fileId: file.id,
        fileName: file.path.split('/').pop() ?? 'file',
      });
    },
    [conversationId, downloadFile]
  );

  const handleDownloadWorkspace = useCallback(() => {
    downloadWorkspace.mutate(conversationId);
  }, [conversationId, downloadWorkspace]);

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex h-10 shrink-0 items-center justify-between border-b px-3">
        <div className="flex items-center gap-2">
          <FolderTree className="size-4 text-primary" />
          <span className="text-sm font-medium">{t('workspace.title')}</span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 cursor-pointer"
              onClick={handleDownloadWorkspace}
              disabled={!files || files.length === 0}
            >
              <Download className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>{t('workspace.downloadZip')}</TooltipContent>
        </Tooltip>
      </div>

      {/* Content: file tree + editor */}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize="25%" minSize="15%" maxSize="50%">
          <FileTree
            files={files ?? []}
            selectedFileId={activeFileId}
            onSelectFile={handleSelectFile}
            onDownloadFile={handleDownloadFile}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize="75%">
          <FileEditor
            conversationId={conversationId}
            tabs={openTabs}
            activeFileId={activeFileId}
            onSelectTab={setActiveFileId}
            onCloseTab={handleCloseTab}
            onTabModified={handleTabModified}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
