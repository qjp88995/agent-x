import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'system' | 'light' | 'dark';

interface ThemeState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  root.classList.toggle('dark', isDark);
}

export const useThemeStore = create<ThemeState>()(
  persist(
    set => ({
      theme: 'system',
      setTheme: theme => {
        applyTheme(theme);
        set({ theme });
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
  .matchMedia('(prefers-color-scheme: dark)')
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
