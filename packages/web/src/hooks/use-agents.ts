import type {
  AgentResponse,
  AgentStatus,
  CreateAgentDto,
  UpdateAgentDto,
} from '@agent-x/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api';

export const AGENTS_KEY = ['agents'] as const;

export function agentKey(id: string) {
  return ['agents', id] as const;
}

export function useAgents(status?: AgentStatus) {
  return useQuery({
    queryKey: status ? [...AGENTS_KEY, { status }] : AGENTS_KEY,
    queryFn: async () => {
      const params = status ? { status } : undefined;
      const { data } = await api.get<AgentResponse[]>('/agents', { params });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAgent(id: string | undefined) {
  return useQuery({
    queryKey: agentKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<AgentResponse>(`/agents/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateAgentDto) => {
      const { data } = await api.post<AgentResponse>('/agents', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    },
  });
}

export function useUpdateAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, dto }: { id: string; dto: UpdateAgentDto }) => {
      const { data } = await api.put<AgentResponse>(`/agents/${id}`, dto);
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: agentKey(variables.id) });
    },
  });
}

export function useDeleteAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/agents/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
    },
  });
}

export function useArchiveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<AgentResponse>(`/agents/${id}/archive`);
      return data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: agentKey(id) });
    },
  });
}

export function useUnarchiveAgent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<AgentResponse>(`/agents/${id}/unarchive`);
      return data;
    },
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({ queryKey: agentKey(id) });
    },
  });
}

export function useAddAgentMcp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      mcpServerId,
      enabledTools,
    }: {
      agentId: string;
      mcpServerId: string;
      enabledTools?: string[];
    }) => {
      const { data } = await api.post(`/agents/${agentId}/mcp-servers`, {
        mcpServerId,
        enabledTools,
      });
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: agentKey(variables.agentId),
      });
    },
  });
}

export function useRemoveAgentMcp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      mcpServerId,
    }: {
      agentId: string;
      mcpServerId: string;
    }) => {
      await api.delete(`/agents/${agentId}/mcp-servers/${mcpServerId}`);
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: agentKey(variables.agentId),
      });
    },
  });
}

export function useUpdateAgentMcp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      agentId,
      mcpServerId,
      enabledTools,
    }: {
      agentId: string;
      mcpServerId: string;
      enabledTools: string[];
    }) => {
      const { data } = await api.patch(
        `/agents/${agentId}/mcp-servers/${mcpServerId}`,
        { enabledTools }
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: AGENTS_KEY });
      void queryClient.invalidateQueries({
        queryKey: agentKey(variables.agentId),
      });
    },
  });
}
