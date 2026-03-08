import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type {
  WorkspaceFileContentResponse,
  WorkspaceFileResponse,
} from '@agent-x/shared';
import { toast } from 'sonner';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import {
  useCreateDirectory,
  useCreateFile,
  useDeleteDirectory,
  useDeleteFile,
  useDownloadFile,
  useRenameDirectory,
  useRenameFile,
  useWorkspaceFiles,
} from '@/hooks/use-workspace';
import { api } from '@/lib/api';

import { FileEditor, type OpenTab } from './file-editor';
import { type ClipboardItem, FileTree } from './file-tree';

interface WorkspacePanelProps {
  readonly conversationId: string;
}

export function WorkspacePanel({ conversationId }: WorkspacePanelProps) {
  const { t } = useTranslation();
  const { data: files } = useWorkspaceFiles(conversationId);
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

  const pasteInProgress = useRef(false);

  const deduplicatePath = useCallback(
    (targetDir: string, fileName: string, isDirectory: boolean) => {
      const basePath = targetDir ? `${targetDir}/${fileName}` : fileName;
      const existingPaths = new Set((files ?? []).map(f => f.path));
      if (!existingPaths.has(basePath)) return basePath;

      const dotIdx = !isDirectory ? fileName.lastIndexOf('.') : -1;
      const baseName = dotIdx > 0 ? fileName.slice(0, dotIdx) : fileName;
      const ext = dotIdx > 0 ? fileName.slice(dotIdx) : '';
      let counter = 1;
      let destPath: string;
      do {
        const copyName = `${baseName} (${counter})${ext}`;
        destPath = targetDir ? `${targetDir}/${copyName}` : copyName;
        counter++;
      } while (existingPaths.has(destPath));
      return destPath;
    },
    [files]
  );

  const handlePaste = useCallback(
    async (targetDir: string) => {
      if (!clipboard || pasteInProgress.current) return;
      pasteInProgress.current = true;

      try {
        const name = clipboard.path.split('/').pop() ?? '';

        if (clipboard.operation === 'cut') {
          const destPath = deduplicatePath(
            targetDir,
            name,
            clipboard.type === 'directory'
          );
          if (clipboard.type === 'file' && clipboard.fileId) {
            renameFileMutation.mutate({
              conversationId,
              fileId: clipboard.fileId,
              newPath: destPath,
            });
          } else if (clipboard.type === 'directory') {
            renameDirMutation.mutate({
              conversationId,
              oldPath: clipboard.path,
              newPath: destPath,
            });
          }
          setClipboard(null);
        } else if (clipboard.operation === 'copy') {
          if (clipboard.type === 'file' && clipboard.fileId) {
            const { data: source } =
              await api.get<WorkspaceFileContentResponse>(
                `/conversations/${conversationId}/files/${clipboard.fileId}/content`
              );
            const destPath = deduplicatePath(targetDir, name, false);
            createFileMutation.mutate(
              {
                conversationId,
                path: destPath,
                content: source.content,
              },
              {
                onSuccess: data => {
                  toast.success(t('workspace.filePasted'));
                  handleSelectFile(data);
                },
              }
            );
          }
          // Keep clipboard for repeated paste
        }
      } finally {
        pasteInProgress.current = false;
      }
    },
    [
      clipboard,
      conversationId,
      deduplicatePath,
      renameFileMutation,
      renameDirMutation,
      createFileMutation,
      handleSelectFile,
      t,
    ]
  );

  return (
    <div className="flex h-full flex-col">
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel
          defaultSize="25%"
          minSize="15%"
          maxSize="50%"
          className="overflow-hidden"
        >
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
