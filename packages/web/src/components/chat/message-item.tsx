import { memo, useMemo } from 'react';

import type { ReasoningUIPart, UIMessage } from 'ai';
import { Bot, User } from 'lucide-react';

import { FileChangeCard } from '@/components/workspace/file-change-card';
import { cn } from '@/lib/utils';
import { extractFileChanges, type FileChange } from '@/lib/workspace-utils';

import { MarkdownRenderer } from './markdown-renderer';
import { ThinkingBlock } from './thinking-block';
import { TimeCard } from './time-card';
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
  'patchFile',
  'renameFile',
  'createDirectory',
  'deleteDirectory',
  'renameDirectory',
  'readFile',
  'listFiles',
  'searchFiles',
  'fileExists',
  'fileInfo',
  'readFileLines',
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

interface WorkspaceToolGroup {
  readonly startIndex: number;
  readonly indices: Set<number>;
  readonly changes: FileChange[];
  readonly loading: boolean;
}

/**
 * Group consecutive workspace tool parts and extract file changes per group.
 * Text/reasoning parts between tools break the group.
 */
function computeWorkspaceGroups(
  parts: UIMessage['parts']
): Map<number, WorkspaceToolGroup> {
  const groups: WorkspaceToolGroup[] = [];
  let current: {
    indices: number[];
    parts: { type: string; [k: string]: unknown }[];
  } | null = null;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (isToolPart(part) && isWorkspaceTool(part)) {
      if (!current) {
        current = { indices: [], parts: [] };
      }
      current.indices.push(i);
      current.parts.push(part as { type: string; [k: string]: unknown });
    } else if (current) {
      // Non-workspace part breaks the group
      groups.push(finalizeGroup(current));
      current = null;
    }
  }
  if (current) {
    groups.push(finalizeGroup(current));
  }

  // Build a map: startIndex → group, and index → group for quick lookup
  const byIndex = new Map<number, WorkspaceToolGroup>();
  for (const group of groups) {
    for (const idx of group.indices) {
      byIndex.set(idx, group);
    }
  }
  return byIndex;
}

function finalizeGroup(current: {
  indices: number[];
  parts: { type: string; [k: string]: unknown }[];
}): WorkspaceToolGroup {
  const changes = extractFileChanges(current.parts);
  const loading = current.parts.some(
    p =>
      (p as unknown as ToolUIPart).state !== 'output-available' &&
      (p as unknown as ToolUIPart).state !== 'output-error'
  );
  return {
    startIndex: current.indices[0],
    indices: new Set(current.indices),
    changes,
    loading,
  };
}

function AssistantContent({
  parts,
  streaming,
}: {
  readonly parts: UIMessage['parts'];
  readonly streaming?: boolean;
}) {
  const groupMap = useMemo(() => computeWorkspaceGroups(parts), [parts]);

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
          // Render workspace tools as grouped file change cards
          if (isWorkspaceTool(part)) {
            const group = groupMap.get(i);
            if (!group) return null;
            if (i === group.startIndex) {
              if (group.changes.length > 0) {
                return (
                  <FileChangeCard
                    key={`file-changes-${i}`}
                    changes={group.changes}
                    loading={group.loading}
                  />
                );
              }
              // No changes extracted — fall through to ToolCallBlock
            } else {
              return null;
            }
          }

          if (getToolName(part) === 'getCurrentTime') {
            return (
              <TimeCard
                key={part.toolCallId ?? `tool-${i}`}
                state={part.state}
                output={part.output as any}
              />
            );
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
            ? 'bg-primary/15 text-primary dark:bg-primary/20'
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
            ? 'bg-primary/10 text-foreground dark:bg-primary/15'
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
