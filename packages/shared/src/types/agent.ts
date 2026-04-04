export const AgentStatus = {
  ACTIVE: 'ACTIVE',
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
  thinkingEnabled?: boolean;
}

export interface UpdateAgentDto {
  name?: string;
  description?: string;
  providerId?: string;
  modelId?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  thinkingEnabled?: boolean;
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
  thinkingEnabled: boolean;
  status: AgentStatus;
  latestVersion: number | null;
  skills: {
    id: string;
    skillId: string;
    priority: number;
    skill: {
      id: string;
      name: string;
      description: string | null;
      type: string;
      tags: string[];
    };
  }[];
  mcpServers: {
    id: string;
    mcpServerId: string;
    enabledTools: string[];
    mcpServer: {
      id: string;
      name: string;
      description: string | null;
      transport: string;
      tools:
        | {
            name: string;
            description?: string;
            inputSchema?: Record<string, unknown>;
          }[]
        | null;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}
