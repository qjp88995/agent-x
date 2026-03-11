import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { persistPreference } from '@/lib/sync-preferences';

export type Theme = 'system' | 'light' | 'dark';

interface SetThemeOptions {
  sync?: boolean;
}

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme, options?: SetThemeOptions) => void;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isLight =
    theme === 'light' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: light)').matches);

  root.classList.toggle('light', isLight);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: (theme, { sync = true } = {}) => {
        applyTheme(theme);
        set({ theme });
        if (sync) {
          persistPreference({ theme });
        }
      },
    }),
    {
      name: 'theme',
      onRehydrateStorage: () => state => {
        if (state) {
          applyTheme(state.theme);
        }
      },
    }
  )
);

// Listen for system theme changes
window
  .matchMedia('(prefers-color-scheme: light)')
  .addEventListener('change', () => {
    const { theme } = useThemeStore.getState();
    if (theme === 'system') {
      applyTheme('system');
    }
  });

// Sync theme across browser tabs via storage event
window.addEventListener('storage', e => {
  if (e.key === 'theme' && e.newValue) {
    try {
      const { state } = JSON.parse(e.newValue) as { state: ThemeState };
      applyTheme(state.theme);
      useThemeStore.setState({ theme: state.theme });
    } catch {
      // ignore malformed storage data
    }
  }
});
