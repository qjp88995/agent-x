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

export function useCreateFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      path,
      content,
    }: {
      conversationId: string;
      path: string;
      content: string;
    }) => {
      const { data } = await api.post<WorkspaceFileResponse>(
        `/conversations/${conversationId}/files`,
        { path, content }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      fileId,
    }: {
      conversationId: string;
      fileId: string;
    }) => {
      await api.delete(`/conversations/${conversationId}/files/${fileId}`);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      fileId,
      newPath,
    }: {
      conversationId: string;
      fileId: string;
      newPath: string;
    }) => {
      const { data } = await api.patch<WorkspaceFileResponse>(
        `/conversations/${conversationId}/files/${fileId}/rename`,
        { newPath }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useCreateDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      path,
    }: {
      conversationId: string;
      path: string;
    }) => {
      await api.post(`/conversations/${conversationId}/files/directories`, {
        path,
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useDeleteDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      path,
    }: {
      conversationId: string;
      path: string;
    }) => {
      const { data } = await api.delete(
        `/conversations/${conversationId}/files/directories`,
        { data: { path } }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useRenameDirectory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      oldPath,
      newPath,
    }: {
      conversationId: string;
      oldPath: string;
      newPath: string;
    }) => {
      await api.patch(
        `/conversations/${conversationId}/files/directories/rename`,
        { oldPath, newPath }
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}
