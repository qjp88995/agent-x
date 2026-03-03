export const ProviderProtocol = {
  OPENAI: 'OPENAI',
  ANTHROPIC: 'ANTHROPIC',
  GEMINI: 'GEMINI',
} as const;

export type ProviderProtocol = (typeof ProviderProtocol)[keyof typeof ProviderProtocol];

export interface CreateProviderDto {
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  apiKey: string;
}

export interface UpdateProviderDto {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  isActive?: boolean;
}

export interface ProviderResponse {
  id: string;
  name: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  isActive: boolean;
  models: ProviderModelResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface ProviderModelResponse {
  id: string;
  modelId: string;
  name: string;
  isActive: boolean;
}
