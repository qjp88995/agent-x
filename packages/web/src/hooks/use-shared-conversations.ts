import type {
  MessageResponse,
  SharedConversationResponse,
} from '@agent-x/shared';
import { useQuery } from '@tanstack/react-query';

import { api } from '@/lib/api';

function sharedConversationsKey(agentId: string) {
  return ['shared-conversations', agentId] as const;
}

function sharedConversationMessagesKey(
  agentId: string,
  conversationId: string
) {
  return ['shared-conversation-messages', agentId, conversationId] as const;
}

export function useSharedConversations(agentId: string | undefined) {
  return useQuery({
    queryKey: sharedConversationsKey(agentId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<SharedConversationResponse[]>(
        `/agents/${agentId}/shared-conversations`
      );
      return data;
    },
    enabled: !!agentId,
  });
}

export function useSharedConversationMessages(
  agentId: string | undefined,
  conversationId: string | undefined
) {
  return useQuery({
    queryKey: sharedConversationMessagesKey(
      agentId ?? '',
      conversationId ?? ''
    ),
    queryFn: async () => {
      const { data } = await api.get<MessageResponse[]>(
        `/agents/${agentId}/shared-conversations/${conversationId}/messages`
      );
      return data;
    },
    enabled: !!agentId && !!conversationId,
  });
}
