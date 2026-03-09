import type {
  CreateProviderDto,
  ProviderModelResponse,
  ProviderResponse,
  UpdateProviderDto,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

const PROVIDERS_KEY = ['providers'] as const;

function providerKey(id: string) {
  return ['providers', id] as const;
}

export function useProviders() {
  return useQuery({
    queryKey: PROVIDERS_KEY,
    queryFn: async () => {
      const { data } = await api.get<ProviderResponse[]>('/providers');
      return data;
    },
  });
}

export function useProvider(id: string | undefined) {
  return useQuery({
    queryKey: providerKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<ProviderResponse>(`/providers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateProviderDto) => {
      const { data } = await api.post<ProviderResponse>('/providers', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateProviderDto }) => {
      const { data } = await api.put<ProviderResponse>(`/providers/${id}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
      void queryClient.invalidateQueries({
        queryKey: providerKey(variables.id),
      });
    },
  });
}

export function useDeleteProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/providers/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
    },
  });
}

interface TestResult {
  readonly success: boolean;
  readonly message: string;
}

export function useTestProvider() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<TestResult>(`/providers/${id}/test`);
      return data;
    },
  });
}

export function useSyncModels() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<{
        synced: number;
        models: ProviderModelResponse[];
      }>(`/providers/${id}/sync-models`);
      return data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: PROVIDERS_KEY });
      void queryClient.invalidateQueries({ queryKey: providerKey(id) });
    },
  });
}
