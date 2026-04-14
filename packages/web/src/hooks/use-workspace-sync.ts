import { useEffect, useRef } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import type { UIMessage } from 'ai';

import { workspaceFilesKey } from './use-workspace';

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
]);

function getToolName(part: { type: string; toolName?: string }): string {
  return (
    part.toolName ?? (part.type.startsWith('tool-') ? part.type.slice(5) : '')
  );
}

function countCompletedWorkspaceTools(messages: UIMessage[]): number {
  let count = 0;
  for (const msg of messages) {
    if (msg.role !== 'assistant') continue;
    for (const part of msg.parts) {
      if (
        'toolCallId' in part &&
        'state' in part &&
        (part as Record<string, unknown>).state === 'output-available' &&
        WORKSPACE_TOOLS.has(
          getToolName(part as { type: string; toolName?: string })
        )
      ) {
        count++;
      }
    }
  }
  return count;
}

export function useWorkspaceSync(
  conversationId: string | undefined,
  messages: UIMessage[]
) {
  const queryClient = useQueryClient();
  const prevCountRef = useRef(0);

  useEffect(() => {
    if (!conversationId) return;

    const currentCount = countCompletedWorkspaceTools(messages);
    if (currentCount > prevCountRef.current) {
      prevCountRef.current = currentCount;
      void queryClient.invalidateQueries({
        queryKey: workspaceFilesKey(conversationId),
      });
      // Also invalidate file content queries so open tabs reflect AI changes
      void queryClient.invalidateQueries({
        queryKey: ['workspace-files', conversationId, 'content'],
      });
    }
  }, [messages, conversationId, queryClient]);
}
