import type { MessageResponse, SharedAgentInfo } from '@agent-x/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

const publicApi = axios.create({
  baseURL: '/api',
});

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

export function useCreateSharedConversation() {
  return useMutation({
    mutationFn: async ({ token }: { token: string }) => {
      const { data } = await publicApi.post<{ id: string }>(
        `/shared/${token}/conversations`
      );
      return data;
    },
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
