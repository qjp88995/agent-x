export type FileChangeOperation = 'created' | 'updated' | 'deleted' | 'renamed';

export interface FileChange {
  readonly path: string;
  readonly operation: FileChangeOperation;
}

/**
 * Extract file changes from tool call results in message parts.
 * Detects workspace tool calls: createFile, updateFile, deleteFile, writeFiles
 */
function parseInput(raw: unknown): Record<string, unknown> | undefined {
  if (raw == null) return undefined;
  if (typeof raw === 'object' && !Array.isArray(raw))
    return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && !Array.isArray(parsed)) return parsed;
    } catch {
      // Incomplete JSON from interrupted stream
    }
  }
  return undefined;
}

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

    const toolName =
      (part as { toolName?: string }).toolName ??
      (part.type.startsWith('tool-') ? part.type.slice(5) : '');
    const input = parseInput(part.input);

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
    } else if (toolName === 'patchFile' && input?.path) {
      changes.push({ path: input.path as string, operation: 'updated' });
    } else if (toolName === 'renameFile' && input?.oldPath) {
      changes.push({
        path: `${input.oldPath as string} → ${input.newPath as string}`,
        operation: 'renamed',
      });
    } else if (toolName === 'createDirectory' && input?.path) {
      changes.push({ path: input.path as string, operation: 'created' });
    } else if (toolName === 'deleteDirectory' && input?.path) {
      changes.push({ path: input.path as string, operation: 'deleted' });
    }
  }

  return changes;
}
