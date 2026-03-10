import type {
  CreatePromptCategoryDto,
  CreatePromptDto,
  PromptCategoryResponse,
  PromptResponse,
  UpdatePromptDto,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

const PROMPTS_KEY = ['prompts'] as const;
const PROMPTS_MARKET_KEY = ['prompts', 'market'] as const;
const PROMPT_CATEGORIES_KEY = ['prompts', 'categories'] as const;

function promptKey(id: string) {
  return ['prompts', id] as const;
}

export function usePromptCategories() {
  return useQuery({
    queryKey: PROMPT_CATEGORIES_KEY,
    queryFn: async () => {
      const { data } = await api.get<PromptCategoryResponse[]>(
        '/prompts/categories'
      );
      return data;
    },
  });
}

export function useCreatePromptCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePromptCategoryDto) => {
      const { data } = await api.post<PromptCategoryResponse>(
        '/prompts/categories',
        dto
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPT_CATEGORIES_KEY });
    },
  });
}

export function useDeletePromptCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prompts/categories/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPT_CATEGORIES_KEY });
    },
  });
}

export function usePromptMarket() {
  return useQuery({
    queryKey: PROMPTS_MARKET_KEY,
    queryFn: async () => {
      const { data } = await api.get<PromptResponse[]>('/prompts/market');
      return data;
    },
  });
}

export function useCreateMarketplacePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePromptDto) => {
      const { data } = await api.post<PromptResponse>('/prompts/market', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_MARKET_KEY });
    },
  });
}

export function useUpdateMarketplacePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePromptDto }) => {
      const { data } = await api.put<PromptResponse>(
        `/prompts/market/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_MARKET_KEY });
      void queryClient.invalidateQueries({
        queryKey: promptKey(variables.id),
      });
    },
  });
}

export function useDeleteMarketplacePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prompts/market/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_MARKET_KEY });
    },
  });
}

export function usePrompts() {
  return useQuery({
    queryKey: PROMPTS_KEY,
    queryFn: async () => {
      const { data } = await api.get<PromptResponse[]>('/prompts');
      return data;
    },
  });
}

export function usePrompt(id: string | undefined) {
  return useQuery({
    queryKey: promptKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<PromptResponse>(`/prompts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreatePromptDto) => {
      const { data } = await api.post<PromptResponse>('/prompts', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_KEY });
    },
  });
}

export function useUpdatePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdatePromptDto }) => {
      const { data } = await api.put<PromptResponse>(`/prompts/${id}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: promptKey(variables.id),
      });
    },
  });
}

export function useDeletePrompt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/prompts/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROMPTS_KEY });
    },
  });
}
