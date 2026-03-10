import type {
  CreateSystemProviderDto,
  GenerateDto,
  GenerateResponse,
  SystemFeatureConfigResponse,
  SystemProviderResponse,
  UpdateSystemFeatureConfigDto,
  UpdateSystemProviderDto,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

// Query keys
const SYSTEM_PROVIDERS_KEY = ['system-providers'] as const;
const SYSTEM_FEATURES_KEY = ['system-features'] as const;

function systemProviderKey(id: string) {
  return ['system-providers', id] as const;
}

// SystemProvider hooks

export function useSystemProviders() {
  return useQuery({
    queryKey: SYSTEM_PROVIDERS_KEY,
    queryFn: async () => {
      const { data } =
        await api.get<SystemProviderResponse[]>('/system/providers');
      return data;
    },
  });
}

export function useSystemProvider(id: string | undefined) {
  return useQuery({
    queryKey: systemProviderKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<SystemProviderResponse>(
        `/system/providers/${id}`
      );
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSystemProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateSystemProviderDto) => {
      const { data } = await api.post<SystemProviderResponse>(
        '/system/providers',
        dto
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SYSTEM_PROVIDERS_KEY });
    },
  });
}

export function useUpdateSystemProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateSystemProviderDto;
    }) => {
      const { data } = await api.put<SystemProviderResponse>(
        `/system/providers/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: SYSTEM_PROVIDERS_KEY });
      void queryClient.invalidateQueries({
        queryKey: systemProviderKey(variables.id),
      });
    },
  });
}

export function useDeleteSystemProvider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/system/providers/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SYSTEM_PROVIDERS_KEY });
    },
  });
}

interface TestResult {
  readonly success: boolean;
  readonly message: string;
}

export function useTestSystemProvider() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<TestResult>(
        `/system/providers/${id}/test`
      );
      return data;
    },
  });
}

export function useSystemProviderModels(id: string | undefined) {
  return useQuery({
    queryKey: [...systemProviderKey(id ?? ''), 'models'] as const,
    queryFn: async () => {
      const { data } = await api.get<
        ReadonlyArray<{ id: string; name: string }>
      >(`/system/providers/${id}/models`);
      return data;
    },
    enabled: !!id,
  });
}

// Feature config hooks

export function useSystemFeatures() {
  return useQuery({
    queryKey: SYSTEM_FEATURES_KEY,
    queryFn: async () => {
      const { data } =
        await api.get<SystemFeatureConfigResponse[]>('/system/features');
      return data;
    },
  });
}

export function useUpdateSystemFeature() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      featureKey,
      dto,
    }: {
      featureKey: string;
      dto: UpdateSystemFeatureConfigDto;
    }) => {
      const { data } = await api.put<SystemFeatureConfigResponse>(
        `/system/features/${featureKey}`,
        dto
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SYSTEM_FEATURES_KEY });
    },
  });
}

// Feature status hook

export function useFeatureStatus(featureKey: string) {
  return useQuery({
    queryKey: ['system-feature-status', featureKey] as const,
    queryFn: async () => {
      const { data } = await api.get<{ enabled: boolean }>(
        `/system/features/${featureKey}/status`
      );
      return data;
    },
  });
}

// Polish hook

export function usePolishPrompt() {
  return useMutation({
    mutationFn: async (params: { content: string; description?: string }) => {
      const { data } = await api.post<{ result: string }>(
        '/system/polish',
        params
      );
      return data;
    },
  });
}

// Auto-fill hook

export function useAutoFill() {
  return useMutation({
    mutationFn: async (dto: GenerateDto) => {
      const { data } = await api.post<GenerateResponse>(
        '/system/generate',
        dto
      );
      return data;
    },
  });
}
