import type {
  WorkspaceFileContentResponse,
  WorkspaceFileResponse,
  WorkspaceFileTreeResponse,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useWorkspaceApi } from '@/contexts/workspace-api-context';

export const WORKSPACE_FILES_KEY = ['workspace-files'] as const;

export function workspaceFilesKey(conversationId: string) {
  return ['workspace-files', conversationId] as const;
}

export function fileContentKey(conversationId: string, fileId: string) {
  return ['workspace-files', conversationId, 'content', fileId] as const;
}

export function useWorkspaceFiles(conversationId: string | undefined) {
  const { client, filesUrl } = useWorkspaceApi();

  return useQuery({
    queryKey: workspaceFilesKey(conversationId ?? ''),
    queryFn: async () => {
      const { data } = await client.get<WorkspaceFileTreeResponse>(
        filesUrl(conversationId!)
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
  const { client, filesUrl } = useWorkspaceApi();

  return useQuery({
    queryKey: fileContentKey(conversationId ?? '', fileId ?? ''),
    queryFn: async () => {
      const { data } = await client.get<WorkspaceFileContentResponse>(
        `${filesUrl(conversationId!)}/${fileId}/content`
      );
      return data;
    },
    enabled: !!conversationId && !!fileId,
  });
}

export function useUpdateFileContent() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

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
      const { data } = await client.put<WorkspaceFileResponse>(
        `${filesUrl(conversationId)}/${fileId}/content`,
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
  const { client, filesUrl } = useWorkspaceApi();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data } = await client.get<Blob>(
        `${filesUrl(conversationId)}/download`,
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
  const { client, filesUrl } = useWorkspaceApi();

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
      const { data } = await client.get<Blob>(
        `${filesUrl(conversationId)}/${fileId}/download`,
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
  const { client, filesUrl } = useWorkspaceApi();

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
      const { data } = await client.post<WorkspaceFileResponse>(
        filesUrl(conversationId),
        { path, content }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<WorkspaceFileResponse[]>(
        workspaceFilesKey(variables.conversationId),
        old => (old ? [...old, data] : [data])
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

  return useMutation({
    mutationFn: async ({
      conversationId,
      fileId,
    }: {
      conversationId: string;
      fileId: string;
    }) => {
      await client.delete(`${filesUrl(conversationId)}/${fileId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<WorkspaceFileResponse[]>(
        workspaceFilesKey(variables.conversationId),
        old => old?.filter(f => f.id !== variables.fileId)
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

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
      const { data } = await client.patch<WorkspaceFileResponse>(
        `${filesUrl(conversationId)}/${fileId}/rename`,
        { newPath }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<WorkspaceFileResponse[]>(
        workspaceFilesKey(variables.conversationId),
        old => old?.map(f => (f.id === variables.fileId ? data : f))
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useCreateDirectory() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

  return useMutation({
    mutationFn: async ({
      conversationId,
      path,
    }: {
      conversationId: string;
      path: string;
    }) => {
      const { data } = await client.post<WorkspaceFileResponse>(
        `${filesUrl(conversationId)}/directories`,
        { path }
      );
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<WorkspaceFileResponse[]>(
        workspaceFilesKey(variables.conversationId),
        old => (old ? [...old, data] : [data])
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useDeleteDirectory() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

  return useMutation({
    mutationFn: async ({
      conversationId,
      path,
    }: {
      conversationId: string;
      path: string;
    }) => {
      const { data } = await client.delete(
        `${filesUrl(conversationId)}/directories`,
        { data: { path } }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      const prefix = variables.path.endsWith('/')
        ? variables.path
        : `${variables.path}/`;
      queryClient.setQueryData<WorkspaceFileResponse[]>(
        workspaceFilesKey(variables.conversationId),
        old =>
          old?.filter(
            f => !f.path.startsWith(prefix) && f.path !== variables.path
          )
      );
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}

export function useRenameDirectory() {
  const queryClient = useQueryClient();
  const { client, filesUrl } = useWorkspaceApi();

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
      await client.patch(`${filesUrl(conversationId)}/directories/rename`, {
        oldPath,
        newPath,
      });
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(variables.conversationId),
      });
    },
  });
}
