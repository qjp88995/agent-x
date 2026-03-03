export interface CreateApiKeyDto {
  name: string;
  agentId?: string;
  expiresAt?: string;
}

export interface ApiKeyResponse {
  id: string;
  name: string;
  key: string;
  agentId: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}
