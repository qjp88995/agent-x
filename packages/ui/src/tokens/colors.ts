/** Preset colors for agent avatars — each agent gets one randomly */
export const AVATAR_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#ec4899', // pink
  '#f97316', // orange
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#ef4444', // red
  '#6366f1', // indigo
] as const;

/** Get a deterministic avatar color from a string (e.g. agent ID) */
export function getAvatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

/** Semantic color names for programmatic use */
export const COLORS = {
  primary: '#10b981',
  destructive: '#ef4444',
  warning: '#f59e0b',
  info: '#3b82f6',
} as const;
