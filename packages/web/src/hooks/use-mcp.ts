import type {
  CreateMcpServerDto,
  McpServerResponse,
  UpdateMcpServerDto,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

const MCP_SERVERS_KEY = ['mcp-servers'] as const;
const MCP_MARKET_KEY = ['mcp-servers', 'market'] as const;

function mcpServerKey(id: string) {
  return ['mcp-servers', id] as const;
}

export function useMcpMarket() {
  return useQuery({
    queryKey: MCP_MARKET_KEY,
    queryFn: async () => {
      const { data } = await api.get<McpServerResponse[]>(
        '/mcp-servers/market'
      );
      return data;
    },
  });
}

export function useMcpServers() {
  return useQuery({
    queryKey: MCP_SERVERS_KEY,
    queryFn: async () => {
      const { data } = await api.get<McpServerResponse[]>('/mcp-servers');
      return data;
    },
  });
}

export function useMcpServer(id: string | undefined) {
  return useQuery({
    queryKey: mcpServerKey(id ?? ''),
    queryFn: async () => {
      const { data } = await api.get<McpServerResponse>(`/mcp-servers/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateMcpServerDto) => {
      const { data } = await api.post<McpServerResponse>('/mcp-servers', dto);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY });
    },
  });
}

export function useUpdateMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateMcpServerDto;
    }) => {
      const { data } = await api.put<McpServerResponse>(
        `/mcp-servers/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY });
      void queryClient.invalidateQueries({
        queryKey: mcpServerKey(variables.id),
      });
    },
  });
}

export function useDeleteMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/mcp-servers/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MCP_SERVERS_KEY });
    },
  });
}

export function useCreateMarketplaceMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: CreateMcpServerDto) => {
      const { data } = await api.post<McpServerResponse>(
        '/mcp-servers/market',
        dto
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MCP_MARKET_KEY });
    },
  });
}

export function useUpdateMarketplaceMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      dto,
    }: {
      id: string;
      dto: UpdateMcpServerDto;
    }) => {
      const { data } = await api.put<McpServerResponse>(
        `/mcp-servers/market/${id}`,
        dto
      );
      return data;
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: MCP_MARKET_KEY });
      void queryClient.invalidateQueries({
        queryKey: mcpServerKey(variables.id),
      });
    },
  });
}

export function useDeleteMarketplaceMcpServer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/mcp-servers/market/${id}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: MCP_MARKET_KEY });
    },
  });
}

interface McpTestResult {
  success: boolean;
  message: string;
  tools?: Array<{ name: string; description?: string }>;
}

export function useTestMcpServer() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post<McpTestResult>(`/mcp-servers/${id}/test`);
      return data;
    },
  });
}
