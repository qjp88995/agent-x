import { createHash, randomBytes } from 'crypto';

/**
 * Generate a random token with the given prefix.
 * Format: `{prefix}{64 hex chars}`
 */
export function generateToken(prefix: string): string {
  return `${prefix}${randomBytes(32).toString('hex')}`;
}

/**
 * SHA-256 hash a raw token/key for secure storage.
 */
export function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}
