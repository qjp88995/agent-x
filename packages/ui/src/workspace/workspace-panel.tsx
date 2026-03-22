import { useCallback, useEffect, useRef, useState } from 'react';

import { PanelLeft } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '../lib/utils';
import { Button } from '../primitives/button';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '../primitives/resizable';
import { FileEditor } from './file-editor';
import { FileTree } from './file-tree';
import type { ClipboardItem, OpenTab, WorkspaceFile } from './types';

export interface WorkspacePanelLabels {
  readonly fileCreated?: string;
  readonly folderCreated?: string;
  readonly fileDeleted?: string;
  readonly folderDeleted?: string;
  readonly fileRenamed?: string;
  readonly folderRenamed?: string;
  readonly filePasted?: string;
}

interface WorkspacePanelProps {
  readonly files: WorkspaceFile[];
  readonly conversationId: string;
  readonly onCreateFile: (dirPath: string, name: string) => Promise<void>;
  readonly onCreateDirectory: (dirPath: string, name: string) => Promise<void>;
  readonly onDeleteFile: (file: WorkspaceFile) => Promise<void>;
  readonly onDeleteDirectory: (dirPath: string) => Promise<void>;
  readonly onRenameFile: (file: WorkspaceFile, newName: string) => Promise<void>;
  readonly onRenameDirectory: (dirPath: string, newName: string) => Promise<void>;
  readonly onPaste: (
    source: { path: string; fileId?: string; type: 'file' | 'directory' },
    targetDir: string,
    operation: 'copy' | 'cut'
  ) => Promise<void>;
  readonly onDownloadFile: (file: WorkspaceFile) => void;
  readonly onDownloadWorkspace: () => void;
  readonly labels?: WorkspacePanelLabels;
}

export function WorkspacePanel({
  files,
  conversationId,
  onCreateFile,
  onCreateDirectory,
  onDeleteFile,
  onDeleteDirectory,
  onRenameFile,
  onRenameDirectory,
  onPaste,
  onDownloadFile,
  labels,
}: WorkspacePanelProps) {
  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | undefined>();
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [mobileFileTreeOpen, setMobileFileTreeOpen] = useState(false);

  // Sync open tabs when files prop changes
  useEffect(() => {
    setOpenTabs(prev =>
      prev
        .map(tab => {
          const updated = files.find(f => f.id === tab.file.id);
          return updated ? { ...tab, file: updated } : tab;
        })
        .filter(tab => files.some(f => f.id === tab.file.id))
    );
  }, [files]);

  const handleSelectFile = useCallback((file: WorkspaceFile) => {
    setOpenTabs(prev => {
      if (prev.some(tab => tab.file.id === file.id)) return prev;
      return [...prev, { file, modified: false }];
    });
    setActiveFileId(file.id);
  }, []);

  const handleSelectFileMobile = useCallback(
    (file: WorkspaceFile) => {
      handleSelectFile(file);
      setMobileFileTreeOpen(false);
    },
    [handleSelectFile]
  );

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

  const handleCreateFile = useCallback(
    async (dirPath: string, name: string) => {
      try {
        await onCreateFile(dirPath, name);
        toast.success(labels?.fileCreated ?? '文件已创建');
      } catch {
        // error handled by caller
      }
    },
    [onCreateFile, labels]
  );

  const handleCreateDirectory = useCallback(
    async (dirPath: string, name: string) => {
      try {
        await onCreateDirectory(dirPath, name);
        toast.success(labels?.folderCreated ?? '文件夹已创建');
      } catch {
        // error handled by caller
      }
    },
    [onCreateDirectory, labels]
  );

  const handleDeleteFile = useCallback(
    async (file: WorkspaceFile) => {
      try {
        await onDeleteFile(file);
        toast.success(labels?.fileDeleted ?? '文件已删除');
        handleCloseTab(file.id);
      } catch {
        // error handled by caller
      }
    },
    [onDeleteFile, handleCloseTab, labels]
  );

  const handleDeleteDirectory = useCallback(
    async (dirPath: string) => {
      try {
        await onDeleteDirectory(dirPath);
        toast.success(labels?.folderDeleted ?? '文件夹已删除');
        const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
        setOpenTabs(prev =>
          prev.filter(tab => !tab.file.path.startsWith(prefix))
        );
      } catch {
        // error handled by caller
      }
    },
    [onDeleteDirectory, labels]
  );

  const handleRenameFile = useCallback(
    async (file: WorkspaceFile, newName: string) => {
      try {
        await onRenameFile(file, newName);
        toast.success(labels?.fileRenamed ?? '文件已重命名');
      } catch {
        // error handled by caller
      }
    },
    [onRenameFile, labels]
  );

  const handleRenameDirectory = useCallback(
    async (dirPath: string, newName: string) => {
      try {
        await onRenameDirectory(dirPath, newName);
        toast.success(labels?.folderRenamed ?? '文件夹已重命名');
      } catch {
        // error handled by caller
      }
    },
    [onRenameDirectory, labels]
  );

  const handleCopy = useCallback(
    (item: ClipboardItem) => setClipboard(item),
    []
  );

  const handleCut = useCallback(
    (item: ClipboardItem) => setClipboard(item),
    []
  );

  const pasteInProgress = useRef(false);

  const handlePaste = useCallback(
    async (targetDir: string) => {
      if (!clipboard || pasteInProgress.current) return;
      pasteInProgress.current = true;
      try {
        await onPaste(
          { path: clipboard.path, fileId: clipboard.fileId, type: clipboard.type },
          targetDir,
          clipboard.operation
        );
        if (clipboard.operation === 'cut') setClipboard(null);
        toast.success(labels?.filePasted ?? '已粘贴');
      } finally {
        pasteInProgress.current = false;
      }
    },
    [clipboard, onPaste, labels]
  );

  const activeFile = openTabs.find(t => t.file.id === activeFileId)?.file;

  const fileTreeProps = {
    files,
    selectedFileId: activeFileId,
    clipboard,
    onDownloadFile,
    onCreateFile: handleCreateFile,
    onCreateDirectory: handleCreateDirectory,
    onRenameFile: handleRenameFile,
    onRenameDirectory: handleRenameDirectory,
    onDeleteFile: handleDeleteFile,
    onDeleteDirectory: handleDeleteDirectory,
    onCopy: handleCopy,
    onCut: handleCut,
    onPaste: handlePaste,
  };

  return (
    <div className="relative flex h-full flex-col">
      {/* Mobile: backdrop */}
      {mobileFileTreeOpen && (
        <div
          className="absolute inset-0 z-10 bg-black/40 md:hidden"
          onClick={() => setMobileFileTreeOpen(false)}
        />
      )}

      {/* Mobile: file tree drawer */}
      <div
        className={cn(
          'absolute inset-y-0 left-0 z-20 w-64 border-r bg-background transition-transform duration-200 md:hidden',
          mobileFileTreeOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <FileTree {...fileTreeProps} onSelectFile={handleSelectFileMobile} />
      </div>

      {/* Mobile: toolbar + editor */}
      <div className="flex flex-1 flex-col overflow-hidden md:hidden">
        <div className="flex h-9 shrink-0 items-center gap-2 border-b bg-surface/20 px-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            onClick={() => setMobileFileTreeOpen(v => !v)}
            aria-label="Toggle file tree"
          >
            <PanelLeft className="size-4" />
          </Button>
          {activeFile && (
            <span className="truncate text-xs text-foreground-muted">
              {activeFile.path}
            </span>
          )}
        </div>
        <FileEditor
          conversationId={conversationId}
          tabs={openTabs}
          activeFileId={activeFileId}
          onSelectTab={setActiveFileId}
          onCloseTab={handleCloseTab}
          onTabModified={handleTabModified}
        />
      </div>

      {/* Desktop: resizable split */}
      <div className="hidden flex-1 md:flex">
        <ResizablePanelGroup orientation="horizontal" className="flex-1">
          <ResizablePanel
            defaultSize={30}
            minSize={15}
            maxSize={50}
            className="overflow-hidden"
          >
            <FileTree {...fileTreeProps} onSelectFile={handleSelectFile} />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize={70}>
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
    </div>
  );
}
