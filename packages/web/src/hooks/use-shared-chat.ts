import type { MessageResponse, SharedAgentInfo } from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { publicApi } from '@/lib/public-api';

export interface SharedConversation {
  readonly id: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export function useSharedAgentInfo(token: string | undefined) {
  return useQuery({
    queryKey: ['shared-agent-info', token],
    queryFn: async () => {
      const { data } = await publicApi.get<SharedAgentInfo>(
        `/shared/${token}/info`
      );
      return data;
    },
    enabled: !!token,
    retry: false,
  });
}

export const SHARED_CONVERSATIONS_KEY = ['shared-conversations'] as const;

export function sharedConversationsKey(token: string) {
  return ['shared-conversations', token] as const;
}

export function useSharedConversations(token: string | undefined) {
  return useQuery({
    queryKey: sharedConversationsKey(token ?? ''),
    queryFn: async () => {
      const { data } = await publicApi.get<SharedConversation[]>(
        `/shared/${token}/conversations`
      );
      return data;
    },
    enabled: !!token,
  });
}

export function useCreateSharedConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const { data } = await publicApi.post<SharedConversation>(
        `/shared/${token}/conversations`
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: sharedConversationsKey(variables.token),
      });
    },
  });
}

export function useSharedWorkspaceFiles(
  token: string | undefined,
  conversationId: string | undefined
) {
  return useQuery({
    queryKey: ['workspace-files', conversationId ?? ''],
    queryFn: async () => {
      const { data } = await publicApi.get(
        `/shared/${token}/conversations/${conversationId}/files`
      );
      return data as Array<{ id: string; path: string }>;
    },
    enabled: !!token && !!conversationId,
  });
}

export function useSharedMessages(
  token: string | undefined,
  conversationId: string | undefined
) {
  return useQuery({
    queryKey: ['shared-messages', token, conversationId],
    queryFn: async () => {
      const { data } = await publicApi.get<MessageResponse[]>(
        `/shared/${token}/conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: !!token && !!conversationId,
  });
}
