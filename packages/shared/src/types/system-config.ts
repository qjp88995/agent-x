import type { ProviderProtocol } from './provider';

// SystemProvider
export interface CreateSystemProviderDto {
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  apiKey: string;
}

export interface UpdateSystemProviderDto {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface SystemProviderResponse {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// SystemFeatureConfig
export interface UpdateSystemFeatureConfigDto {
  systemProviderId?: string | null;
  modelId?: string | null;
  systemPrompt?: string | null;
  isEnabled?: boolean;
}

export interface SystemFeatureConfigResponse {
  id: string;
  featureKey: string;
  systemProviderId: string | null;
  modelId: string | null;
  systemPrompt: string | null;
  isEnabled: boolean;
  systemProvider: SystemProviderResponse | null;
  createdAt: string;
  updatedAt: string;
}

// Polish
export interface PolishPromptDto {
  content: string;
  description?: string;
}

// Generate (auto-fill)
export interface GenerateFieldSchema {
  type: 'string';
  description: string;
}

export interface GenerateDto {
  content: string;
  outputSchema: Record<string, GenerateFieldSchema>;
}

export interface GenerateResponse {
  result: Record<string, string>;
}
