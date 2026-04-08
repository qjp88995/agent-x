import { useEffect, useMemo } from 'react';

import type { WorkspaceFile } from '@agent-x/design';
import { WorkspacePanel } from '@agent-x/design';
import { useQueryClient } from '@tanstack/react-query';

import { useWorkspaceApi } from '@/contexts/workspace-api-context';
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
  workspaceFilesKey,
} from '@/hooks/use-workspace';

interface WorkspaceContainerProps {
  readonly conversationId: string;
}

export function WorkspaceContainer({
  conversationId,
}: WorkspaceContainerProps) {
  const queryClient = useQueryClient();
  const { data: rawFiles = [] } = useWorkspaceFiles(conversationId);
  const { client, filesUrl } = useWorkspaceApi();

  // Map WorkspaceFileResponse → WorkspaceFile by adding the missing `name` field
  const files = useMemo(
    (): WorkspaceFile[] =>
      rawFiles.map(f => ({
        ...f,
        name: f.path.split('/').pop() ?? f.path,
      })),
    [rawFiles]
  );

  const createFile = useCreateFile();
  const createDirectory = useCreateDirectory();
  const deleteFile = useDeleteFile();
  const deleteDirectory = useDeleteDirectory();
  const renameFile = useRenameFile();
  const renameDirectory = useRenameDirectory();
  const downloadFile = useDownloadFile();
  const downloadWorkspace = useDownloadWorkspace();

  // Listen for workspace-file-saved events dispatched by FileEditor after saving.
  // FileEditor writes via the API directly (bypassing React Query mutations), so we
  // must manually invalidate the query cache to pick up updated file metadata.
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (
        e as CustomEvent<{ conversationId: string; fileId: string }>
      ).detail;
      if (detail.conversationId === conversationId) {
        void queryClient.invalidateQueries({
          queryKey: workspaceFilesKey(conversationId),
        });
      }
    };
    document.addEventListener('workspace-file-saved', handler);
    return () => document.removeEventListener('workspace-file-saved', handler);
  }, [conversationId, queryClient]);

  const handlePaste = async (
    source: { path: string; fileId?: string; type: 'file' | 'directory' },
    targetDir: string,
    operation: 'copy' | 'cut'
  ) => {
    const name = source.path.split('/').pop() ?? '';

    if (operation === 'cut') {
      const destPath = targetDir ? `${targetDir}/${name}` : name;
      if (source.type === 'file' && source.fileId) {
        await renameFile.mutateAsync({
          conversationId,
          fileId: source.fileId,
          newPath: destPath,
        });
      } else if (source.type === 'directory') {
        await renameDirectory.mutateAsync({
          conversationId,
          oldPath: source.path,
          newPath: destPath,
        });
      }
    } else {
      if (source.type === 'file' && source.fileId) {
        const { data } = await client.get<{ content: string }>(
          `${filesUrl(conversationId)}/${source.fileId}/content`
        );
        const destPath = targetDir ? `${targetDir}/${name}` : name;
        await createFile.mutateAsync({
          conversationId,
          path: destPath,
          content: data.content,
        });
      }
    }
  };

  return (
    <WorkspacePanel
      files={files}
      conversationId={conversationId}
      onCreateFile={(dirPath, name) =>
        createFile
          .mutateAsync({
            conversationId,
            path: dirPath ? `${dirPath}/${name}` : name,
            content: '',
          })
          .then(() => {})
      }
      onCreateDirectory={(dirPath, name) =>
        createDirectory
          .mutateAsync({
            conversationId,
            path: dirPath ? `${dirPath}/${name}` : name,
          })
          .then(() => {})
      }
      onDeleteFile={file =>
        deleteFile
          .mutateAsync({ conversationId, fileId: file.id })
          .then(() => {})
      }
      onDeleteDirectory={dirPath =>
        deleteDirectory
          .mutateAsync({ conversationId, path: dirPath })
          .then(() => {})
      }
      onRenameFile={(file, newName) => {
        const dir = file.path.includes('/')
          ? file.path.substring(0, file.path.lastIndexOf('/'))
          : '';
        const newPath = dir ? `${dir}/${newName}` : newName;
        return renameFile
          .mutateAsync({ conversationId, fileId: file.id, newPath })
          .then(() => {});
      }}
      onRenameDirectory={(dirPath, newName) => {
        const parent = dirPath.includes('/')
          ? dirPath.substring(0, dirPath.lastIndexOf('/'))
          : '';
        const newDir = parent ? `${parent}/${newName}` : newName;
        return renameDirectory
          .mutateAsync({ conversationId, oldPath: dirPath, newPath: newDir })
          .then(() => {});
      }}
      onPaste={handlePaste}
      onDownloadFile={file =>
        downloadFile.mutate({
          conversationId,
          fileId: file.id,
          fileName: file.name,
        })
      }
      onDownloadWorkspace={() => downloadWorkspace.mutate(conversationId)}
    />
  );
}
