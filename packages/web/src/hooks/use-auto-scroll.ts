import { useCallback, useEffect, useRef } from 'react';

const SCROLL_THRESHOLD = 8;

export function useAutoScroll(isStreaming: boolean) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const autoScrollRef = useRef(true);

  // Auto-scroll on every render while auto-scroll is enabled
  useEffect(() => {
    if (!autoScrollRef.current) return;
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
  });

  // Re-enable auto-scroll whenever streaming starts
  useEffect(() => {
    if (isStreaming) autoScrollRef.current = true;
  }, [isStreaming]);

  const handleScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight <= SCROLL_THRESHOLD;
    autoScrollRef.current = atBottom;
  }, []);

  // Call when the user sends a message to force scroll to bottom
  const scrollToBottom = useCallback(() => {
    autoScrollRef.current = true;
    sentinelRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  return { scrollContainerRef, sentinelRef, handleScroll, scrollToBottom };
}
