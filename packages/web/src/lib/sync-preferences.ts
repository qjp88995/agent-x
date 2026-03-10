import { api } from './api';

export function persistPreference(
  dto: { theme?: string } | { language?: string }
): void {
  const token = localStorage.getItem('accessToken');
  if (!token) return;

  void api.patch('/preferences', dto).catch(() => {
    // Silently ignore — local state is already applied
  });
}
