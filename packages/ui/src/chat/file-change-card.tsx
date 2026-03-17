import { useState } from 'react';

import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileMinus,
  FilePlus,
  FileQuestion,
  FileSearch,
  FolderMinus,
  FolderOpen,
  FolderPlus,
  Loader2,
  Search,
} from 'lucide-react';

import { cn } from '../lib/utils';

export type FileChangeOperation =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'renamed'
  | 'read'
  | 'listed'
  | 'searched'
  | 'checked'
  | 'dir-created'
  | 'dir-deleted'
  | 'dir-renamed';

export interface FileChange {
  readonly path: string;
  readonly operation: FileChangeOperation;
}

interface FileChangeCardProps {
  readonly changes: FileChange[];
  readonly loading?: boolean;
  readonly onClickFile?: (path: string) => void;
  readonly labels?: {
    writing?: string;
    filesWriting?: (count: number) => string;
    filesChanged?: (count: number) => string;
    operations?: Partial<Record<FileChangeOperation, string>>;
  };
}

const DEFAULT_OPERATION_LABELS: Record<FileChangeOperation, string> = {
  created: 'Created',
  updated: 'Updated',
  deleted: 'Deleted',
  renamed: 'Renamed',
  read: 'Read',
  listed: 'Listed',
  searched: 'Searched',
  checked: 'Checked',
  'dir-created': 'Folder created',
  'dir-deleted': 'Folder deleted',
  'dir-renamed': 'Folder renamed',
};

const OPERATION_CONFIG: Record<
  FileChangeOperation,
  { icon: typeof FilePlus; colorClass: string }
> = {
  created: { icon: FilePlus, colorClass: 'text-green-500' },
  updated: { icon: FileCheck, colorClass: 'text-blue-500' },
  deleted: { icon: FileMinus, colorClass: 'text-red-500' },
  renamed: { icon: ArrowRightLeft, colorClass: 'text-orange-500' },
  read: { icon: FileSearch, colorClass: 'text-foreground-muted' },
  listed: { icon: FolderOpen, colorClass: 'text-foreground-muted' },
  searched: { icon: Search, colorClass: 'text-foreground-muted' },
  checked: { icon: FileQuestion, colorClass: 'text-foreground-muted' },
  'dir-created': { icon: FolderPlus, colorClass: 'text-green-500' },
  'dir-deleted': { icon: FolderMinus, colorClass: 'text-red-500' },
  'dir-renamed': { icon: ArrowRightLeft, colorClass: 'text-orange-500' },
};

export function FileChangeCard({
  changes,
  loading,
  onClickFile,
  labels,
}: FileChangeCardProps) {
  const [expanded, setExpanded] = useState(changes.length <= 3);

  const getOperationLabel = (op: FileChangeOperation): string =>
    labels?.operations?.[op] ?? DEFAULT_OPERATION_LABELS[op];

  const writingLabel =
    labels?.writing ?? 'Writing\u2026';
  const filesWritingLabel =
    labels?.filesWriting ?? ((count: number) => `Writing ${count} files\u2026`);
  const filesChangedLabel =
    labels?.filesChanged ?? ((count: number) => `${count} files changed`);

  if (changes.length === 0) return null;

  // Single file change
  if (changes.length === 1) {
    const change = changes[0];
    const config = OPERATION_CONFIG[change.operation];
    const Icon = config.icon;

    return (
      <button
        type="button"
        className="my-1 max-w-full flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm transition-colors hover:bg-card/30"
        onClick={() => onClickFile?.(change.path)}
      >
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Icon className={cn('size-4 shrink-0', config.colorClass)} />
        )}
        <span className="truncate font-mono text-xs">{change.path}</span>
        <span className="text-foreground-muted text-[10px] shrink-0">
          {loading ? writingLabel : getOperationLabel(change.operation)}
        </span>
      </button>
    );
  }

  // Multiple file changes
  return (
    <div className="my-1 overflow-hidden rounded-lg border border-border/50 bg-card text-sm">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-card/30"
        onClick={() => setExpanded(prev => !prev)}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-foreground-muted" />
        )}
        {loading && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        )}
        <span className="text-foreground-muted text-xs">
          {loading
            ? filesWritingLabel(changes.length)
            : filesChangedLabel(changes.length)}
        </span>
      </button>
      {expanded && (
        <div className="border-t px-1 py-1">
          {changes.map(change => {
            const config = OPERATION_CONFIG[change.operation];
            const Icon = config.icon;

            return (
              <button
                key={change.path}
                type="button"
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors hover:bg-card/30"
                onClick={() => onClickFile?.(change.path)}
              >
                <Icon className={cn('size-3.5 shrink-0', config.colorClass)} />
                <span className="truncate font-mono">{change.path}</span>
                <span className="text-foreground-muted text-[10px] ml-auto shrink-0">
                  {getOperationLabel(change.operation)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
