import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import {
  ChevronDown,
  ChevronRight,
  Download,
  File,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TreeNode {
  readonly name: string;
  readonly path: string;
  readonly isDirectory: boolean;
  readonly file?: WorkspaceFileResponse;
  readonly children: TreeNode[];
}

function buildTree(files: WorkspaceFileResponse[]): TreeNode[] {
  const root: TreeNode[] = [];

  for (const file of files) {
    const parts = file.path.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      const pathSoFar = parts.slice(0, i + 1).join('/');

      const existing = current.find(n => n.name === name);

      if (isLast) {
        if (!existing) {
          current.push({
            name,
            path: pathSoFar,
            isDirectory: false,
            file,
            children: [],
          });
        }
      } else {
        if (existing && existing.isDirectory) {
          current = existing.children;
        } else {
          const dir: TreeNode = {
            name,
            path: pathSoFar,
            isDirectory: true,
            children: [],
          };
          current.push(dir);
          current = dir.children;
        }
      }
    }
  }

  // Sort: directories first, then alphabetically
  function sortNodes(nodes: TreeNode[]): TreeNode[] {
    return [...nodes].sort((a, b) => {
      if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }

  function sortTree(nodes: TreeNode[]): TreeNode[] {
    return sortNodes(nodes).map(node =>
      node.isDirectory ? { ...node, children: sortTree(node.children) } : node
    );
  }

  return sortTree(root);
}

function getFileIcon(mimeType: string, fileName: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType === 'application/json' || fileName.endsWith('.json'))
    return FileJson;
  if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/javascript' ||
    mimeType === 'application/typescript' ||
    mimeType === 'application/xml'
  )
    return FileCode;
  if (mimeType === 'text/plain' || fileName.endsWith('.txt')) return FileText;
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface TreeNodeItemProps {
  readonly node: TreeNode;
  readonly depth: number;
  readonly selectedFileId: string | undefined;
  readonly expandedDirs: ReadonlySet<string>;
  readonly onToggleDir: (path: string) => void;
  readonly onSelectFile: (file: WorkspaceFileResponse) => void;
  readonly onDownloadFile: (file: WorkspaceFileResponse) => void;
}

function TreeNodeItem({
  node,
  depth,
  selectedFileId,
  expandedDirs,
  onToggleDir,
  onSelectFile,
  onDownloadFile,
}: TreeNodeItemProps) {
  const { t } = useTranslation();
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);

  if (node.isDirectory) {
    const isExpanded = expandedDirs.has(node.path);
    return (
      <div>
        <button
          type="button"
          className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-accent/50 transition-colors"
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onToggleDir(node.path)}
        >
          {isExpanded ? (
            <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
          )}
          {isExpanded ? (
            <FolderOpen className="size-4 shrink-0 text-primary/70" />
          ) : (
            <Folder className="size-4 shrink-0 text-primary/70" />
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {isExpanded &&
          node.children.map(child => (
            <TreeNodeItem
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedFileId={selectedFileId}
              expandedDirs={expandedDirs}
              onToggleDir={onToggleDir}
              onSelectFile={onSelectFile}
              onDownloadFile={onDownloadFile}
            />
          ))}
      </div>
    );
  }

  const file = node.file!;
  const Icon = getFileIcon(file.mimeType, node.name);
  const isSelected = selectedFileId === file.id;

  return (
    <>
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
          isSelected ? 'bg-accent text-accent-foreground' : 'hover:bg-accent/50'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelectFile(file)}
        onContextMenu={e => {
          e.preventDefault();
          setMenuPos({ x: e.clientX, y: e.clientY });
        }}
      >
        <span className="size-3.5 shrink-0" />
        <Icon className="size-4 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1 text-left">{node.name}</span>
        <span className="text-muted-foreground text-[10px] shrink-0">
          {formatFileSize(file.size)}
        </span>
      </button>
      <DropdownMenu
        open={menuPos !== null}
        onOpenChange={open => {
          if (!open) setMenuPos(null);
        }}
      >
        <DropdownMenuTrigger asChild>
          <span
            className="fixed size-0"
            style={{
              left: menuPos?.x ?? 0,
              top: menuPos?.y ?? 0,
              pointerEvents: 'none',
            }}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          <DropdownMenuItem
            onClick={() => onDownloadFile(file)}
            className="cursor-pointer"
          >
            <Download className="mr-2 size-4" />
            {t('workspace.downloadFile')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

interface FileTreeProps {
  readonly files: WorkspaceFileResponse[];
  readonly selectedFileId?: string;
  readonly onSelectFile: (file: WorkspaceFileResponse) => void;
  readonly onDownloadFile: (file: WorkspaceFileResponse) => void;
}

export function FileTree({
  files,
  selectedFileId,
  onSelectFile,
  onDownloadFile,
}: FileTreeProps) {
  const { t } = useTranslation();
  const tree = useMemo(() => buildTree(files), [files]);
  const [expandedDirs, setExpandedDirs] = useState<ReadonlySet<string>>(() => {
    // Auto-expand all directories initially
    const dirs = new Set<string>();
    for (const file of files) {
      const parts = file.path.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
    }
    return dirs;
  });

  const handleToggleDir = useCallback((path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
        <Folder className="mb-2 size-8 opacity-40" />
        <p className="text-xs">{t('workspace.noFiles')}</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="py-1">
        {tree.map(node => (
          <TreeNodeItem
            key={node.path}
            node={node}
            depth={0}
            selectedFileId={selectedFileId}
            expandedDirs={expandedDirs}
            onToggleDir={handleToggleDir}
            onSelectFile={onSelectFile}
            onDownloadFile={onDownloadFile}
          />
        ))}
      </div>
    </ScrollArea>
  );
}
