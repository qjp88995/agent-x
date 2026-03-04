export interface CreateShareTokenDto {
  name: string;
  expiresAt?: string;
  maxConversations?: number;
}

export interface ShareTokenResponse {
  id: string;
  agentVersionId: string;
  name: string;
  expiresAt: string | null;
  maxConversations: number | null;
  usedConversations: number;
  isActive: boolean;
  createdAt: string;
}

export interface ShareTokenCreatedResponse extends ShareTokenResponse {
  plainToken: string;
}

export interface SharedAgentInfo {
  agentName: string;
  agentDescription: string | null;
  agentAvatar: string | null;
  versionNumber: number;
}
