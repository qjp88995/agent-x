import type { CreateConversationDto, MessageResponse } from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

interface ConversationAgent {
  readonly id: string;
  readonly name: string;
  readonly avatar: string | null;
}

export interface ConversationWithAgent {
  readonly id: string;
  readonly agentId: string;
  readonly title: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly agent: ConversationAgent;
}

const CONVERSATIONS_KEY = ['conversations'] as const;

function messagesKey(conversationId: string) {
  return ['messages', conversationId] as const;
}

export function useConversations() {
  return useQuery({
    queryKey: CONVERSATIONS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ConversationWithAgent[]>('/conversations');
      return data;
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateConversationDto) => {
      const { data } = await api.post<ConversationWithAgent>(
        '/conversations',
        dto
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/conversations/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CONVERSATIONS_KEY });
    },
  });
}

export function useMessages(conversationId: string | undefined) {
  return useQuery({
    queryKey: messagesKey(conversationId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<MessageResponse[]>(
        `/conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: !!conversationId,
  });
}
