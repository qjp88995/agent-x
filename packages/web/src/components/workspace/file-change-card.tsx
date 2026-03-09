import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ArrowRightLeft,
  ChevronDown,
  ChevronRight,
  FileCheck,
  FileMinus,
  FilePlus,
  Loader2,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { FileChange, FileChangeOperation } from '@/lib/workspace-utils';

const OPERATION_CONFIG: Record<
  FileChangeOperation,
  { icon: typeof FilePlus; colorClass: string; labelKey: string }
> = {
  created: {
    icon: FilePlus,
    colorClass: 'text-green-500',
    labelKey: 'workspace.fileCreated',
  },
  updated: {
    icon: FileCheck,
    colorClass: 'text-blue-500',
    labelKey: 'workspace.fileUpdated',
  },
  deleted: {
    icon: FileMinus,
    colorClass: 'text-red-500',
    labelKey: 'workspace.fileDeleted',
  },
  renamed: {
    icon: ArrowRightLeft,
    colorClass: 'text-orange-500',
    labelKey: 'workspace.fileRenamed',
  },
};

interface FileChangeCardProps {
  readonly changes: FileChange[];
  readonly loading?: boolean;
  readonly onClickFile?: (path: string) => void;
}

export function FileChangeCard({
  changes,
  loading,
  onClickFile,
}: FileChangeCardProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(changes.length <= 3);

  if (changes.length === 0) return null;

  // Single file change
  if (changes.length === 1) {
    const change = changes[0];
    const config = OPERATION_CONFIG[change.operation];
    const Icon = config.icon;

    return (
      <button
        type="button"
        className="my-1 flex items-center gap-2 rounded-lg border border-border/50 bg-card px-3 py-2 text-sm transition-colors hover:bg-accent/30"
        onClick={() => onClickFile?.(change.path)}
      >
        {loading ? (
          <Loader2 className="size-4 shrink-0 animate-spin text-primary" />
        ) : (
          <Icon className={cn('size-4 shrink-0', config.colorClass)} />
        )}
        <span className="truncate font-mono text-xs">{change.path}</span>
        <span className="text-muted-foreground text-[10px] shrink-0">
          {loading ? t('workspace.fileWriting') : t(config.labelKey)}
        </span>
      </button>
    );
  }

  // Multiple file changes
  return (
    <div className="my-1 overflow-hidden rounded-lg border border-border/50 bg-card text-sm">
      <button
        type="button"
        className="flex w-full items-center gap-2 px-3 py-2 transition-colors hover:bg-accent/30"
        onClick={() => setExpanded(prev => !prev)}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        {loading && (
          <Loader2 className="size-3.5 shrink-0 animate-spin text-primary" />
        )}
        <span className="text-muted-foreground text-xs">
          {loading
            ? t('workspace.filesWriting', { count: changes.length })
            : t('workspace.filesChanged', { count: changes.length })}
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
                className="flex w-full items-center gap-2 rounded px-2 py-1 text-xs transition-colors hover:bg-accent/30"
                onClick={() => onClickFile?.(change.path)}
              >
                <Icon className={cn('size-3.5 shrink-0', config.colorClass)} />
                <span className="truncate font-mono">{change.path}</span>
                <span className="text-muted-foreground text-[10px] ml-auto shrink-0">
                  {t(config.labelKey)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
