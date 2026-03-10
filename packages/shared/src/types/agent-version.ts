export interface SkillSnapshot {
  skillId: string;
  name: string;
  content: string;
  priority: number;
}

export interface McpServerSnapshot {
  mcpServerId: string;
  name: string;
  transport: string;
  config: Record<string, unknown>;
  enabledTools: string[];
}

export interface CreateVersionDto {
  changelog?: string;
}

export interface AgentVersionResponse {
  id: string;
  agentId: string;
  version: number;
  providerId: string;
  modelId: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  thinkingEnabled: boolean;
  skillsSnapshot: SkillSnapshot[];
  mcpServersSnapshot: McpServerSnapshot[];
  changelog: string | null;
  publishedAt: string;
  createdAt: string;
  provider?: { name: string };
  _count?: {
    shareTokens: number;
    conversations: number;
  };
}
