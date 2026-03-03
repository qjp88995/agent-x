export const AgentStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type AgentStatus = (typeof AgentStatus)[keyof typeof AgentStatus];

export interface CreateAgentDto {
  name: string;
  description?: string;
  providerId: string;
  modelId: string;
  systemPrompt: string;
  temperature?: number;
  maxTokens?: number;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  providerId?: string;
  modelId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  avatar?: string;
}

export interface AgentResponse {
  id: string;
  name: string;
  description: string | null;
  avatar: string | null;
  providerId: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  status: AgentStatus;
  version: number;
  skills: { id: string; skillId: string; priority: number }[];
  mcpServers: { id: string; mcpServerId: string; enabledTools: string[] }[];
  createdAt: string;
  updatedAt: string;
}
