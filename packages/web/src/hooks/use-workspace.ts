import type {
  WorkspaceFileContentResponse,
  WorkspaceFileResponse,
  WorkspaceFileTreeResponse,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export const WORKSPACE_FILES_KEY = ['workspace-files'] as const;

export function workspaceFilesKey(conversationId: string) {
  return ['workspace-files', conversationId] as const;
}

export function fileContentKey(conversationId: string, fileId: string) {
  return ['workspace-files', conversationId, 'content', fileId] as const;
}

export function useWorkspaceFiles(conversationId: string | undefined) {
  return useQuery({
    queryKey: workspaceFilesKey(conversationId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<WorkspaceFileTreeResponse>(
        `/conversations/${conversationId}/files`
      );
      return data;
    },
    enabled: !!conversationId,
  });
}

export function useFileContent(
  conversationId: string | undefined,
  fileId: string | undefined
) {
  return useQuery({
    queryKey: fileContentKey(conversationId ?? '', fileId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<WorkspaceFileContentResponse>(
        `/conversations/${conversationId}/files/${fileId}/content`
      );
      return data;
    },
    enabled: !!conversationId && !!fileId,
  });
}

export function useUpdateFileContent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      fileId,
      content,
    }: {
      conversationId: string;
      fileId: string;
      content: string;
    }) => {
      const { data } = await api.put<WorkspaceFileResponse>(
        `/conversations/${conversationId}/files/${fileId}/content`,
        { content }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
      void queryClient.invalidateQueries({
        queryKey: fileContentKey(variables.conversationId, variables.fileId),
      });
    },
  });
}

export function useDownloadWorkspace() {
  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await api.get<Blob>(
        `/conversations/${conversationId}/files/download`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = `workspace-${conversationId}.zip`;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}

export function useDownloadFile() {
  return useMutation({
    mutationFn: async ({
      conversationId,
      fileId,
      fileName,
    }: {
      conversationId: string;
      fileId: string;
      fileName: string;
    }) => {
      const { data } = await api.get<Blob>(
        `/conversations/${conversationId}/files/${fileId}/download`,
        { responseType: 'blob' }
      );
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    },
  });
}
