import { useEffect, useMemo, useRef, useState } from 'react';

/** Pass this value to `setFilter` to clear the active filter (show all items). */
export const FILTER_ALL = 'all' as const;

interface UseFilteredSearchOptions<T> {
  readonly searchKeys: ReadonlyArray<keyof T & string>;
  readonly filterKey?: keyof T & string;
  readonly debounceMs?: number;
}

interface UseFilteredSearchResult<T> {
  readonly search: string;
  readonly setSearch: (value: string) => void;
  readonly filter: string;
  readonly setFilter: (value: string) => void;
  readonly filtered: T[];
}

export function useFilteredSearch<T>(
  items: readonly T[] | undefined,
  options: UseFilteredSearchOptions<T>
): UseFilteredSearchResult<T> {
  const { searchKeys, filterKey, debounceMs = 300 } = options;

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState(FILTER_ALL);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, debounceMs);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [search, debounceMs]);

  const filtered = useMemo<T[]>(() => {
    const source: T[] = items ? [...items] : [];

    let result = source;

    if (filterKey && filter !== FILTER_ALL) {
      result = result.filter(item => String(item[filterKey]) === filter);
    }

    if (debouncedSearch.trim() !== '') {
      const query = debouncedSearch.trim().toLowerCase();
      result = result.filter(item =>
        searchKeys.some(key => {
          const value = item[key];
          return (
            typeof value === 'string' && value.toLowerCase().includes(query)
          );
        })
      );
    }

    return result;
  }, [items, filter, filterKey, debouncedSearch, searchKeys]);

  return { search, setSearch, filter, setFilter, filtered };
}
