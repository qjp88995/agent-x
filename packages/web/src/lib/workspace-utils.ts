export type FileChangeOperation = 'created' | 'updated' | 'deleted';

export interface FileChange {
  readonly path: string;
  readonly operation: FileChangeOperation;
}

/**
 * Extract file changes from tool call results in message parts.
 * Detects workspace tool calls: createFile, updateFile, deleteFile, writeFiles
 */
export function extractFileChanges(
  parts: readonly { type: string; [key: string]: unknown }[]
): FileChange[] {
  const changes: FileChange[] = [];

  for (const part of parts) {
    if (
      !part.type.startsWith('tool-') &&
      part.type !== 'dynamic-tool' &&
      part.type !== 'tool-result'
    ) {
      continue;
    }

    const toolName = (part as { toolName?: string }).toolName ?? '';
    const input = part.input as Record<string, unknown> | undefined;

    if (toolName === 'createFile' && input?.path) {
      changes.push({ path: input.path as string, operation: 'created' });
    } else if (toolName === 'updateFile' && input?.path) {
      changes.push({ path: input.path as string, operation: 'updated' });
    } else if (toolName === 'deleteFile' && input?.path) {
      changes.push({ path: input.path as string, operation: 'deleted' });
    } else if (toolName === 'writeFiles' && input?.files) {
      const files = input.files as Array<{ path: string }>;
      for (const file of files) {
        changes.push({ path: file.path, operation: 'created' });
      }
    }
  }

  return changes;
}
