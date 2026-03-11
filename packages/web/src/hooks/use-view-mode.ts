import { useEffect,useState } from 'react';

import type { ViewMode } from '@agent-x/design';

function getStorageKey(pageKey: string): string {
  return `view-mode:${pageKey}`;
}

function readFromStorage(pageKey: string): ViewMode {
  try {
    const raw = localStorage.getItem(getStorageKey(pageKey));
    if (raw === 'table' || raw === 'grid') {
      return raw;
    }
  } catch {
    // localStorage unavailable (e.g. SSR or private mode)
  }
  return 'grid';
}

export function useViewMode(
  pageKey: string
): [ViewMode, (v: ViewMode) => void] {
  const [view, setViewState] = useState<ViewMode>(() =>
    readFromStorage(pageKey)
  );

  useEffect(() => {
    try {
      localStorage.setItem(getStorageKey(pageKey), view);
    } catch {
      // ignore write errors
    }
  }, [pageKey, view]);

  return [view, setViewState];
}
