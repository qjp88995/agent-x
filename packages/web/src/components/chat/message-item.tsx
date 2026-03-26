import { memo, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type FileChange,
  FileChangeCard,
  MarkdownContent,
  MessageBubble,
  ThinkingBlock,
  TimeCard,
  ToolCallBlock,
} from '@agent-x/design';
import type { ReasoningUIPart, UIMessage } from 'ai';

import { extractFileChanges } from '@/lib/workspace-utils';

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1">
      <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:0ms]" />
      <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:150ms]" />
      <span className="bg-foreground-muted/60 size-1.5 animate-bounce rounded-full [animation-delay:300ms]" />
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

function AssistantContent({ parts }: { readonly parts: UIMessage['parts'] }) {
  const { t } = useTranslation();
  const groupMap = useMemo(() => computeWorkspaceGroups(parts), [parts]);

  const toolCallLabels = useMemo(
    () => ({
      preparing: t('toolCall.preparing'),
      calling: t('toolCall.calling'),
      completed: t('toolCall.completed'),
      error: t('toolCall.error'),
      input: t('toolCall.input'),
      output: t('toolCall.output'),
    }),
    [t]
  );

  const timeCardLabels = useMemo(
    () => ({
      loading: t('toolCall.gettingTime'),
      error: t('toolCall.error'),
    }),
    [t]
  );

  const fileChangeLabels = useMemo(
    () => ({
      writing: t('workspace.fileWriting'),
      filesWriting: (count: number) => t('workspace.filesWriting', { count }),
      filesChanged: (count: number) => t('workspace.filesChanged', { count }),
      operations: {
        created: t('workspace.fileCreated'),
        updated: t('workspace.fileUpdated'),
        deleted: t('workspace.fileDeleted'),
        renamed: t('workspace.fileRenamed'),
        read: t('workspace.fileRead'),
        listed: t('workspace.fileListed'),
        searched: t('workspace.fileSearched'),
        checked: t('workspace.fileChecked'),
        'dir-created': t('workspace.folderCreated'),
        'dir-deleted': t('workspace.folderDeleted'),
        'dir-renamed': t('workspace.folderRenamed'),
      },
    }),
    [t]
  );

  return (
    <div>
      {parts.map((part, i) => {
        if (part.type === 'reasoning') {
          const rp = part as ReasoningUIPart;
          return (
            <ThinkingBlock
              key={`reasoning-${i}`}
              defaultOpen={rp.state !== 'done'}
            >
              <div className="whitespace-pre-wrap">{rp.text || '...'}</div>
            </ThinkingBlock>
          );
        }
        if (part.type === 'text') {
          const text = (part as { type: 'text'; text: string }).text;
          if (!text) return null;
          return <MarkdownContent key={`text-${i}`} content={text} />;
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
                    labels={fileChangeLabels}
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
                labels={timeCardLabels}
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
              labels={toolCallLabels}
            />
          );
        }
        return null;
      })}
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
    <MessageBubble
      role={isUser ? 'user' : 'assistant'}
      avatar={isUser ? undefined : { name: 'Agent-X' }}
      streaming={streaming && !isUser}
      className="px-4 py-3"
    >
      {showTyping ? (
        <TypingIndicator />
      ) : isUser ? (
        <p className="whitespace-pre-wrap">
          {message.parts
            .filter(
              (p): p is { type: 'text'; text: string } => p.type === 'text'
            )
            .map(p => p.text)
            .join('')}
        </p>
      ) : (
        <AssistantContent parts={message.parts} />
      )}
    </MessageBubble>
  );
});
