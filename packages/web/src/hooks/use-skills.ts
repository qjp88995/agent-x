import type {
  CreateSkillDto,
  SkillResponse,
  UpdateSkillDto,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

const SKILLS_KEY = ['skills'] as const;
const SKILLS_MARKET_KEY = ['skills', 'market'] as const;

function skillKey(id: string) {
  return ['skills', id] as const;
}

export function useSkillMarket() {
  return useQuery({
    queryKey: SKILLS_MARKET_KEY,
    queryFn: async () => {
      const { data } = await api.get<SkillResponse[]>('/skills/market');
      return data;
    },
  });
}

export function useSkills() {
  return useQuery({
    queryKey: SKILLS_KEY,
    queryFn: async () => {
      const { data } = await api.get<SkillResponse[]>('/skills');
      return data;
    },
  });
}

export function useSkill(id: string | undefined) {
  return useQuery({
    queryKey: skillKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<SkillResponse>(`/skills/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateSkillDto) => {
      const { data } = await api.post<SkillResponse>('/skills', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_KEY });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSkillDto }) => {
      const { data } = await api.put<SkillResponse>(`/skills/${id}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_KEY });
      void queryClient.invalidateQueries({ queryKey: skillKey(variables.id) });
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_KEY });
    },
  });
}

export function useCreateMarketplaceSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateSkillDto) => {
      const { data } = await api.post<SkillResponse>('/skills/market', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_MARKET_KEY });
    },
  });
}

export function useUpdateMarketplaceSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateSkillDto }) => {
      const { data } = await api.put<SkillResponse>(
        `/skills/market/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_MARKET_KEY });
      void queryClient.invalidateQueries({ queryKey: skillKey(variables.id) });
    },
  });
}

export function useDeleteMarketplaceSkill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/skills/market/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: SKILLS_MARKET_KEY });
    },
  });
}
