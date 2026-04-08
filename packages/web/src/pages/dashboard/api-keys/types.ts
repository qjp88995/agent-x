import type { ApiKeyResponse } from '@/hooks/use-api-keys';

export type ApiKeyStatus = 'active' | 'expired' | 'revoked';

export type ApiKeyWithStatus = ApiKeyResponse & {
  readonly status: ApiKeyStatus;
};

export function computeStatus(apiKey: ApiKeyResponse): ApiKeyStatus {
  if (!apiKey.isActive) return 'revoked';
  if (apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date())
    return 'expired';
  return 'active';
}

export function withStatus(
  apiKeys: readonly ApiKeyResponse[]
): ApiKeyWithStatus[] {
  return apiKeys.map(k => ({ ...k, status: computeStatus(k) }));
}
