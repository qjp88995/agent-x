import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface ApiKeyAgent {
  readonly id: string;
  readonly name: string;
}

export interface ApiKeyResponse {
  readonly id: string;
  readonly userId: string;
  readonly agentId: string | null;
  readonly key: string;
  readonly name: string;
  readonly lastUsedAt: string | null;
  readonly expiresAt: string | null;
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly agent: ApiKeyAgent | null;
}

export interface ApiKeyCreateResponse extends ApiKeyResponse {
  readonly plainKey: string;
}

export interface CreateApiKeyDto {
  readonly name: string;
  readonly agentId?: string;
  readonly expiresAt?: string;
}

const API_KEYS_KEY = ['api-keys'] as const;

export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ApiKeyResponse[]>('/api-keys');
      return data;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateApiKeyDto) => {
      const { data } = await api.post<ApiKeyCreateResponse>('/api-keys', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}

export function useDeleteApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: API_KEYS_KEY });
    },
  });
}
