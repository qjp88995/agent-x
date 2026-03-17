import { useEffect, useState } from 'react';

/**
 * Detects whether dark mode is active by observing the `class` attribute
 * on `document.documentElement`. Returns `true` when the `.dark` class
 * is present (or when `.light` is absent, since dark is the default theme).
 */
export function useIsDark() {
  const [isDark, setIsDark] = useState(() =>
    !document.documentElement.classList.contains('light')
  );

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(!document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
    return () => observer.disconnect();
  }, []);

  return isDark;
}
