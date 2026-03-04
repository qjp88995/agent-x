import type { AgentVersionResponse, CreateVersionDto } from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

function versionsKey(agentId: string) {
  return ['agent-versions', agentId] as const;
}

export function useAgentVersions(agentId: string | undefined) {
  return useQuery({
    queryKey: versionsKey(agentId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<AgentVersionResponse[]>(
        `/agents/${agentId}/versions`
      );
      return data;
    },
    enabled: !!agentId,
  });
}

export function usePublishVersion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      dto,
    }: {
      agentId: string;
      dto: CreateVersionDto;
    }) => {
      const { data } = await api.post<AgentVersionResponse>(
        `/agents/${agentId}/versions`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: versionsKey(variables.agentId),
      });
      void queryClient.invalidateQueries({ queryKey: ['agents'] });
      void queryClient.invalidateQueries({
        queryKey: ['agent', variables.agentId],
      });
    },
  });
}
