import { useCallback,useRef } from 'react';

import { Send, Square } from 'lucide-react';

import { Button } from '@/components/ui/button';

interface ChatInputProps {
  readonly onSend: (content: string) => void;
  readonly onStop: () => void;
  readonly isLoading: boolean;
  readonly disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  isLoading,
  disabled = false,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const content = textarea.value.trim();
    if (!content || isLoading) return;

    onSend(content);
    textarea.value = '';
    textarea.style.height = 'auto';
  }, [onSend, isLoading]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, []);

  return (
    <div className="border-t bg-background p-4">
      <div className="mx-auto flex max-w-3xl items-end gap-2">
        <textarea
          ref={textareaRef}
          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[44px] max-h-[200px] w-full resize-none rounded-xl border bg-transparent px-4 py-3 text-sm shadow-sm outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Type a message..."
          rows={1}
          disabled={disabled || isLoading}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
        />
        {isLoading ? (
          <Button
            size="icon"
            variant="destructive"
            className="size-11 shrink-0 rounded-xl"
            onClick={onStop}
          >
            <Square className="size-4" />
            <span className="sr-only">Stop</span>
          </Button>
        ) : (
          <Button
            size="icon"
            className="size-11 shrink-0 rounded-xl"
            onClick={handleSubmit}
            disabled={disabled}
          >
            <Send className="size-4" />
            <span className="sr-only">Send</span>
          </Button>
        )}
      </div>
    </div>
  );
}
