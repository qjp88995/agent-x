import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import { Download, FolderTree } from 'lucide-react';
import { toast } from 'sonner';

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
  useCreateDirectory,
  useCreateFile,
  useDeleteDirectory,
  useDeleteFile,
  useDownloadFile,
  useDownloadWorkspace,
  useRenameDirectory,
  useRenameFile,
  useWorkspaceFiles,
} from '@/hooks/use-workspace';

import { FileEditor, type OpenTab } from './file-editor';
import { type ClipboardItem,FileTree } from './file-tree';

interface WorkspacePanelProps {
  readonly conversationId: string;
}

export function WorkspacePanel({ conversationId }: WorkspacePanelProps) {
  const { t } = useTranslation();
  const { data: files } = useWorkspaceFiles(conversationId);
  const downloadWorkspace = useDownloadWorkspace();
  const downloadFile = useDownloadFile();

  const createFileMutation = useCreateFile();
  const deleteFileMutation = useDeleteFile();
  const renameFileMutation = useRenameFile();
  const createDirMutation = useCreateDirectory();
  const deleteDirMutation = useDeleteDirectory();
  const renameDirMutation = useRenameDirectory();

  const [openTabs, setOpenTabs] = useState<OpenTab[]>([]);
  const [activeFileId, setActiveFileId] = useState<string | undefined>();
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);

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

  const handleCreateFile = useCallback(
    (dirPath: string, name: string) => {
      const filePath = dirPath ? `${dirPath}/${name}` : name;
      createFileMutation.mutate(
        { conversationId, path: filePath, content: '' },
        {
          onSuccess: data => {
            toast.success(t('workspace.fileCreatedManual'));
            handleSelectFile(data);
          },
        }
      );
    },
    [conversationId, createFileMutation, handleSelectFile, t]
  );

  const handleCreateDirectory = useCallback(
    (dirPath: string, name: string) => {
      const fullPath = dirPath ? `${dirPath}/${name}` : name;
      createDirMutation.mutate(
        { conversationId, path: fullPath },
        { onSuccess: () => toast.success(t('workspace.folderCreated')) }
      );
    },
    [conversationId, createDirMutation, t]
  );

  const handleDeleteFile = useCallback(
    (file: WorkspaceFileResponse) => {
      deleteFileMutation.mutate(
        { conversationId, fileId: file.id },
        {
          onSuccess: () => {
            toast.success(t('workspace.fileDeleted'));
            handleCloseTab(file.id);
          },
        }
      );
    },
    [conversationId, deleteFileMutation, handleCloseTab, t]
  );

  const handleDeleteDirectory = useCallback(
    (dirPath: string) => {
      deleteDirMutation.mutate(
        { conversationId, path: dirPath },
        {
          onSuccess: () => {
            toast.success(t('workspace.folderDeleted'));
            const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
            setOpenTabs(prev =>
              prev.filter(tab => !tab.file.path.startsWith(prefix))
            );
          },
        }
      );
    },
    [conversationId, deleteDirMutation, t]
  );

  const handleRenameFile = useCallback(
    (file: WorkspaceFileResponse, newName: string) => {
      const dir = file.path.includes('/')
        ? file.path.substring(0, file.path.lastIndexOf('/'))
        : '';
      const newPath = dir ? `${dir}/${newName}` : newName;
      renameFileMutation.mutate(
        { conversationId, fileId: file.id, newPath },
        {
          onSuccess: data => {
            toast.success(t('workspace.fileRenamed'));
            setOpenTabs(prev =>
              prev.map(tab =>
                tab.file.id === file.id ? { ...tab, file: data } : tab
              )
            );
          },
        }
      );
    },
    [conversationId, renameFileMutation, t]
  );

  const handleRenameDirectory = useCallback(
    (dirPath: string, newName: string) => {
      const parent = dirPath.includes('/')
        ? dirPath.substring(0, dirPath.lastIndexOf('/'))
        : '';
      const newDir = parent ? `${parent}/${newName}` : newName;
      renameDirMutation.mutate(
        { conversationId, oldPath: dirPath, newPath: newDir },
        { onSuccess: () => toast.success(t('workspace.folderRenamed')) }
      );
    },
    [conversationId, renameDirMutation, t]
  );

  const handleCopy = useCallback(
    (item: ClipboardItem) => setClipboard(item),
    []
  );

  const handleCut = useCallback(
    (item: ClipboardItem) => setClipboard(item),
    []
  );

  const handlePaste = useCallback(
    (targetDir: string) => {
      if (!clipboard) return;
      if (clipboard.operation === 'cut') {
        const name = clipboard.path.split('/').pop() ?? '';
        const newPath = targetDir ? `${targetDir}/${name}` : name;
        if (clipboard.type === 'file' && clipboard.fileId) {
          renameFileMutation.mutate({
            conversationId,
            fileId: clipboard.fileId,
            newPath,
          });
        } else if (clipboard.type === 'directory') {
          renameDirMutation.mutate({
            conversationId,
            oldPath: clipboard.path,
            newPath,
          });
        }
        setClipboard(null);
      }
    },
    [clipboard, conversationId, renameFileMutation, renameDirMutation]
  );

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
            clipboard={clipboard}
            onSelectFile={handleSelectFile}
            onDownloadFile={handleDownloadFile}
            onCreateFile={handleCreateFile}
            onCreateDirectory={handleCreateDirectory}
            onRenameFile={handleRenameFile}
            onRenameDirectory={handleRenameDirectory}
            onDeleteFile={handleDeleteFile}
            onDeleteDirectory={handleDeleteDirectory}
            onCopy={handleCopy}
            onCut={handleCut}
            onPaste={handlePaste}
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
