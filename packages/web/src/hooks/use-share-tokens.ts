import type {
  CreateShareTokenDto,
  ShareTokenCreatedResponse,
  ShareTokenResponse,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

function shareTokensKey(agentId: string, versionId: string) {
  return ['share-tokens', agentId, versionId] as const;
}

export function useShareTokens(
  agentId: string | undefined,
  versionId: string | undefined
) {
  return useQuery({
    queryKey: shareTokensKey(agentId ?? '', versionId ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ShareTokenResponse[]>(
        `/agents/${agentId}/versions/${versionId}/share-tokens`
      );
      return data;
    },
    enabled: !!agentId && !!versionId,
  });
}

export function useCreateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      versionId,
      dto,
    }: {
      agentId: string;
      versionId: string;
      dto: CreateShareTokenDto;
    }) => {
      const { data } = await api.post<ShareTokenCreatedResponse>(
        `/agents/${agentId}/versions/${versionId}/share-tokens`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shareTokensKey(variables.agentId, variables.versionId),
      });
    },
  });
}

export function useDeactivateShareToken() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      versionId,
      tokenId,
    }: {
      agentId: string;
      versionId: string;
      tokenId: string;
    }) => {
      await api.delete(
        `/agents/${agentId}/versions/${versionId}/share-tokens/${tokenId}`
      );
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: shareTokensKey(variables.agentId, variables.versionId),
      });
    },
  });
}
