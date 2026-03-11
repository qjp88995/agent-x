import * as React from 'react';
import { cn } from '../lib/utils';
import { Paperclip, Slash, Mic, ArrowUp, Square } from 'lucide-react';
import { FileChip } from './file-chip';
import { SlashCommandMenu, type SlashCommand } from './slash-command-menu';
import { VoiceRecorder } from './voice-recorder';

type FileAttachment = {
  id: string;
  name: string;
  size: string;
  type?: 'file' | 'image';
  thumbnail?: string;
};

type ChatInputProps = {
  // Text
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;

  // Files
  files?: FileAttachment[];
  onFileRemove?: (id: string) => void;
  onFileUploadClick?: () => void;

  // Slash commands
  commands?: SlashCommand[];
  slashMenuOpen?: boolean;
  onSlashMenuOpenChange?: (open: boolean) => void;
  onSlashSelect?: (command: SlashCommand) => void;
  slashSearch?: string;
  onSlashSearchChange?: (search: string) => void;

  // Voice
  voiceState?: 'idle' | 'recording' | 'transcribing';
  voiceDuration?: number;
  onVoiceStart?: () => void;
  onVoiceStop?: () => void;
  onVoiceCancel?: () => void;

  // Streaming
  streaming?: boolean;
  onStop?: () => void;

  // Drag & drop
  dragOver?: boolean;
  onDragEnter?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;

  disabled?: boolean;
  className?: string;
};

function ChatInput({
  value,
  onChange,
  onSubmit,
  placeholder = 'Type a message...',
  files = [],
  onFileRemove,
  onFileUploadClick,
  commands = [],
  slashMenuOpen = false,
  onSlashMenuOpenChange,
  onSlashSelect,
  slashSearch = '',
  onSlashSearchChange,
  voiceState = 'idle',
  voiceDuration = 0,
  onVoiceStart,
  onVoiceStop,
  onVoiceCancel,
  streaming = false,
  onStop,
  dragOver = false,
  onDragEnter,
  onDragLeave,
  onDrop,
  disabled = false,
  className,
}: ChatInputProps) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Auto-grow textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 144)}px`;
  }, [value]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && !streaming && value.trim()) {
        onSubmit();
      }
    }
  };

  const canSend = value.trim().length > 0 && !streaming && !disabled;

  // Send button appearance
  const sendButtonClass = cn(
    'flex items-center justify-center size-7 rounded-[var(--radius-sm)] transition-colors shrink-0',
    streaming
      ? 'bg-red-500 hover:bg-red-600 text-white cursor-pointer'
      : canSend
        ? 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
        : 'bg-surface text-foreground-ghost pointer-events-none',
  );

  const isVoiceActive = voiceState !== 'idle';

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Slash command menu (positioned above the container) */}
      <div className="relative">
        {slashMenuOpen && (
          <SlashCommandMenu
            commands={commands}
            open={slashMenuOpen}
            onSelect={(cmd) => {
              onSlashSelect?.(cmd);
              onSlashMenuOpenChange?.(false);
            }}
            onOpenChange={(open) => onSlashMenuOpenChange?.(open)}
            search={slashSearch}
            onSearchChange={onSlashSearchChange}
          />
        )}
      </div>

      {/* Main container */}
      <div
        className={cn(
          'border border-border rounded-[var(--radius-lg)] bg-card overflow-hidden',
          disabled && 'opacity-60',
        )}
      >
        {/* Voice recorder replaces textarea + toolbar */}
        {isVoiceActive ? (
          <div className="px-3 py-2">
            <VoiceRecorder
              state={voiceState as 'recording' | 'transcribing'}
              duration={voiceDuration}
              onStop={() => onVoiceStop?.()}
              onCancel={() => onVoiceCancel?.()}
            />
          </div>
        ) : (
          <>
            {/* File chips area */}
            {files.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                {files.map((file) => (
                  <FileChip
                    key={file.id}
                    name={file.name}
                    size={file.size}
                    type={file.type}
                    thumbnail={file.thumbnail}
                    onRemove={onFileRemove ? () => onFileRemove(file.id) : undefined}
                  />
                ))}
              </div>
            )}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              rows={1}
              className={cn(
                'w-full resize-none border-0 bg-transparent px-3 py-2.5',
                'text-[13px] text-foreground placeholder:text-foreground-ghost',
                'focus:outline-none focus:ring-0',
                'max-h-[144px] overflow-y-auto',
                'leading-relaxed',
              )}
            />

            {/* Toolbar */}
            <div className="flex items-center gap-1 px-2 py-1.5 border-t border-border">
              {/* File upload */}
              <button
                type="button"
                onClick={onFileUploadClick}
                disabled={disabled}
                aria-label="Attach file"
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)]',
                  'text-foreground-ghost hover:text-foreground-muted hover:bg-surface',
                  'transition-colors disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                <Paperclip className="size-4" />
              </button>

              {/* Slash commands */}
              <button
                type="button"
                onClick={() => onSlashMenuOpenChange?.(!slashMenuOpen)}
                disabled={disabled}
                aria-label="Slash commands"
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)]',
                  'text-foreground-ghost hover:text-foreground-muted hover:bg-surface',
                  'transition-colors disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                <Slash className="size-4" />
              </button>

              {/* Voice */}
              <button
                type="button"
                onClick={onVoiceStart}
                disabled={disabled}
                aria-label="Voice input"
                className={cn(
                  'flex items-center justify-center h-7 w-7 rounded-[var(--radius-sm)]',
                  'text-foreground-ghost hover:text-foreground-muted hover:bg-surface',
                  'transition-colors disabled:pointer-events-none disabled:opacity-50',
                )}
              >
                <Mic className="size-4" />
              </button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Send / Stop button */}
              <button
                type="button"
                onClick={streaming ? onStop : onSubmit}
                aria-label={streaming ? 'Stop streaming' : 'Send message'}
                className={sendButtonClass}
              >
                {streaming ? (
                  <Square className="size-3.5 fill-current" />
                ) : (
                  <ArrowUp className="size-4" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Drag overlay */}
      {dragOver && (
        <div
          className={cn(
            'absolute inset-0 z-10 flex items-center justify-center',
            'rounded-[var(--radius-lg)] border-2 border-dashed border-emerald-500',
            'bg-emerald-500/10',
          )}
        >
          <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400">
            Drop files here
          </span>
        </div>
      )}
    </div>
  );
}

export { ChatInput, type FileAttachment };
