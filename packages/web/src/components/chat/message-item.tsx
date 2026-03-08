import { memo, useMemo } from 'react';

import type { ReasoningUIPart, UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';

import { FileChangeCard } from '@/components/workspace/file-change-card';
import { cn } from '@/lib/utils';
import { extractFileChanges } from '@/lib/workspace-utils';

import { MarkdownRenderer } from './markdown-renderer';
import { ThinkingBlock } from './thinking-block';
import { ToolCallBlock } from './tool-call-block';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-muted-foreground/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
    </div>
  );
}

interface ToolUIPart {
  readonly type: string;
  readonly toolCallId: string;
  readonly toolName?: string;
  readonly state: string;
  readonly input?: unknown;
  readonly output?: unknown;
  readonly errorText?: string;
}

function isToolPart(part: { type: string }): part is ToolUIPart {
  return (
    (part.type.startsWith('tool-') || part.type === 'dynamic-tool') &&
    'toolCallId' in part
  );
}

function getToolName(part: ToolUIPart): string {
  return part.toolName ?? part.type.slice(5);
}

const WORKSPACE_TOOLS = new Set([
  'createFile',
  'updateFile',
  'deleteFile',
  'writeFiles',
  'readFile',
  'listFiles',
]);

function isWorkspaceTool(part: ToolUIPart): boolean {
  return WORKSPACE_TOOLS.has(getToolName(part));
}

function StreamingIndicator() {
  return (
    <div className="mt-1 flex items-center gap-1.5 py-1">
      <span className="bg-primary/60 size-1.5 animate-pulse rounded-full" />
      <span className="text-muted-foreground/50 text-[10px]">···</span>
    </div>
  );
}

function AssistantContent({
  parts,
  streaming,
}: {
  readonly parts: UIMessage['parts'];
  readonly streaming?: boolean;
}) {
  // Extract file changes from workspace tool calls
  const fileChanges = useMemo(
    () =>
      extractFileChanges(parts as { type: string; [key: string]: unknown }[]),
    [parts]
  );

  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === 'reasoning') {
          const rp = part as ReasoningUIPart;
          return (
            <ThinkingBlock
              key={`reasoning-${i}`}
              content={rp.text}
              done={rp.state === 'done'}
            />
          );
        }
        if (part.type === 'text') {
          const text = (part as { type: 'text'; text: string }).text;
          if (!text) return null;
          return <MarkdownRenderer key={`text-${i}`} content={text} />;
        }
        if (isToolPart(part)) {
          // Render workspace tools as file change cards (skip readFile/listFiles)
          if (
            isWorkspaceTool(part) &&
            getToolName(part) !== 'readFile' &&
            getToolName(part) !== 'listFiles'
          ) {
            // Only render the card once for the group (at the first workspace tool part)
            const firstWorkspaceToolIdx = parts.findIndex(
              p =>
                isToolPart(p) &&
                isWorkspaceTool(p as ToolUIPart) &&
                getToolName(p as ToolUIPart) !== 'readFile' &&
                getToolName(p as ToolUIPart) !== 'listFiles'
            );
            if (i === firstWorkspaceToolIdx) {
              if (fileChanges.length > 0) {
                const loading = parts.some(
                  p =>
                    isToolPart(p) &&
                    isWorkspaceTool(p as ToolUIPart) &&
                    p.state !== 'output-available' &&
                    p.state !== 'output-error'
                );
                return (
                  <FileChangeCard
                    key={`file-changes-${i}`}
                    changes={fileChanges}
                    loading={loading}
                  />
                );
              }
              // No file changes extracted (e.g. incomplete writeFiles) — fall through to ToolCallBlock
            } else {
              return null;
            }
          }

          return (
            <ToolCallBlock
              key={part.toolCallId ?? `tool-${i}`}
              toolName={getToolName(part)}
              state={
                part.state as
                  | 'input-streaming'
                  | 'input-available'
                  | 'output-available'
                  | 'output-error'
              }
              input={part.input}
              output={part.output}
              errorText={part.errorText}
            />
          );
        }
        return null;
      })}
      {streaming && <StreamingIndicator />}
    </div>
  );
}

export const MessageItem = memo(function MessageItem({
  message,
  streaming,
}: {
  readonly message: UIMessage;
  readonly streaming?: boolean;
}) {
  const isUser = message.role === 'user';
  const hasContent = message.parts.some(
    p =>
      (p.type === 'text' &&
        (p as { type: 'text'; text: string }).text.length > 0) ||
      p.type === 'reasoning' ||
      isToolPart(p)
  );
  const showTyping = !isUser && !hasContent;

  return (
    <div
      className={cn('flex gap-3 px-4 py-3', isUser ? 'flex-row-reverse' : '')}
    >
      {/* Avatar */}
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'gradient-bg text-white'
        )}
      >
        {isUser ? <User className="size-4" /> : <Bot className="size-4" />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-card border border-border/50 text-foreground'
        )}
      >
        {showTyping ? (
          <TypingIndicator />
        ) : isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.parts
              .filter(
                (p): p is { type: 'text'; text: string } => p.type === 'text'
              )
              .map(p => p.text)
              .join('')}
          </p>
        ) : (
          <AssistantContent parts={message.parts} streaming={streaming} />
        )}
      </div>
    </div>
  );
});
