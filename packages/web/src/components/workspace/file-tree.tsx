import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import {
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Download,
  File,
  FileCode,
  FileImage,
  FileJson,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Scissors,
  Trash2,
} from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export interface ClipboardItem {
  readonly operation: 'copy' | 'cut';
  readonly type: 'file' | 'directory';
  readonly path: string;
  readonly fileId?: string;
}

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
    // Directory records from the backend
    if (file.isDirectory) {
      const parts = file.path.split('/');
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const name = parts[i];
        const pathSoFar = parts.slice(0, i + 1).join('/');
        const existing = current.find(n => n.name === name);
        if (existing && existing.isDirectory) {
          current = existing.children;
        } else if (!existing) {
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
      continue;
    }

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

function getParentDir(path: string): string {
  const idx = path.lastIndexOf('/');
  return idx > 0 ? path.substring(0, idx) : '';
}

function InlineInput({
  defaultValue,
  placeholder,
  selectWithoutExtension,
  onSubmit,
  onCancel,
}: {
  readonly defaultValue?: string;
  readonly placeholder?: string;
  readonly selectWithoutExtension?: boolean;
  readonly onSubmit: (value: string) => void;
  readonly onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    if (selectWithoutExtension && defaultValue) {
      const dotIdx = defaultValue.lastIndexOf('.');
      input.setSelectionRange(0, dotIdx > 0 ? dotIdx : defaultValue.length);
    } else {
      input.select();
    }
  }, [defaultValue, selectWithoutExtension]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();
    if (e.key === 'Enter') {
      const value = inputRef.current?.value.trim();
      if (value) onSubmit(value);
      else onCancel();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <input
      ref={inputRef}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className="h-6 w-full min-w-0 rounded border border-primary bg-background px-1 text-sm outline-none"
      onKeyDown={handleKeyDown}
      onBlur={() => {
        const value = inputRef.current?.value.trim();
        if (value && value !== defaultValue) onSubmit(value);
        else onCancel();
      }}
    />
  );
}

interface EditingNode {
  readonly type: 'rename-file' | 'rename-dir' | 'new-file' | 'new-dir';
  readonly parentPath: string;
  readonly nodePath?: string;
  readonly fileId?: string;
}

interface DeleteTarget {
  readonly type: 'file' | 'directory';
  readonly name: string;
  readonly path: string;
  readonly file?: WorkspaceFileResponse;
}

interface TreeNodeItemProps {
  readonly node: TreeNode;
  readonly depth: number;
  readonly selectedFileId: string | undefined;
  readonly expandedDirs: ReadonlySet<string>;
  readonly clipboard: ClipboardItem | null;
  readonly editingNode: EditingNode | null;
  readonly onToggleDir: (path: string) => void;
  readonly onSelectFile: (file: WorkspaceFileResponse) => void;
  readonly onDownloadFile: (file: WorkspaceFileResponse) => void;
  readonly onCopy: (item: ClipboardItem) => void;
  readonly onCut: (item: ClipboardItem) => void;
  readonly onPaste: (targetDir: string) => void;
  readonly onSetEditingNode: (node: EditingNode | null) => void;
  readonly onSetDeleteTarget: (target: DeleteTarget | null) => void;
  readonly onCreateFile: (dirPath: string, name: string) => void;
  readonly onCreateDirectory: (dirPath: string, name: string) => void;
  readonly onRenameFile: (file: WorkspaceFileResponse, newName: string) => void;
  readonly onRenameDirectory: (dirPath: string, newName: string) => void;
}

function TreeNodeItem({
  node,
  depth,
  selectedFileId,
  expandedDirs,
  clipboard,
  editingNode,
  onToggleDir,
  onSelectFile,
  onDownloadFile,
  onCopy,
  onCut,
  onPaste,
  onSetEditingNode,
  onSetDeleteTarget,
  onCreateFile,
  onCreateDirectory,
  onRenameFile,
  onRenameDirectory,
}: TreeNodeItemProps) {
  const { t } = useTranslation();

  if (node.isDirectory) {
    const isExpanded = expandedDirs.has(node.path);
    const isRenaming =
      editingNode?.type === 'rename-dir' && editingNode.nodePath === node.path;

    return (
      <div>
        <ContextMenu>
          <ContextMenuTrigger asChild>
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
              {isRenaming ? (
                <InlineInput
                  defaultValue={node.name}
                  onSubmit={newName => {
                    onRenameDirectory(node.path, newName);
                    onSetEditingNode(null);
                  }}
                  onCancel={() => onSetEditingNode(null)}
                />
              ) : (
                <span className="truncate">{node.name}</span>
              )}
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={() => {
                onSetEditingNode({ type: 'new-file', parentPath: node.path });
                if (!isExpanded) onToggleDir(node.path);
              }}
            >
              <FilePlus className="mr-2 size-4" /> {t('workspace.newFile')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                onSetEditingNode({ type: 'new-dir', parentPath: node.path });
                if (!isExpanded) onToggleDir(node.path);
              }}
            >
              <FolderPlus className="mr-2 size-4" /> {t('workspace.newFolder')}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() =>
                onCopy({
                  operation: 'copy',
                  type: 'directory',
                  path: node.path,
                })
              }
            >
              <Copy className="mr-2 size-4" /> {t('common.copy')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                onCut({ operation: 'cut', type: 'directory', path: node.path })
              }
            >
              <Scissors className="mr-2 size-4" /> {t('workspace.cut')}
            </ContextMenuItem>
            {clipboard && (
              <ContextMenuItem onClick={() => onPaste(node.path)}>
                <ClipboardPaste className="mr-2 size-4" />{' '}
                {t('workspace.paste')}
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() =>
                onSetEditingNode({
                  type: 'rename-dir',
                  parentPath: getParentDir(node.path),
                  nodePath: node.path,
                })
              }
            >
              <Pencil className="mr-2 size-4" /> {t('workspace.rename')}
            </ContextMenuItem>
            <ContextMenuItem
              variant="destructive"
              onClick={() =>
                onSetDeleteTarget({
                  type: 'directory',
                  name: node.name,
                  path: node.path,
                })
              }
            >
              <Trash2 className="mr-2 size-4" /> {t('common.delete')}
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {isExpanded && (
          <>
            {node.children.map(child => (
              <TreeNodeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                selectedFileId={selectedFileId}
                expandedDirs={expandedDirs}
                clipboard={clipboard}
                editingNode={editingNode}
                onToggleDir={onToggleDir}
                onSelectFile={onSelectFile}
                onDownloadFile={onDownloadFile}
                onCopy={onCopy}
                onCut={onCut}
                onPaste={onPaste}
                onSetEditingNode={onSetEditingNode}
                onSetDeleteTarget={onSetDeleteTarget}
                onCreateFile={onCreateFile}
                onCreateDirectory={onCreateDirectory}
                onRenameFile={onRenameFile}
                onRenameDirectory={onRenameDirectory}
              />
            ))}
            {editingNode?.type === 'new-file' &&
              editingNode.parentPath === node.path && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                >
                  <span className="size-3.5" />
                  <FilePlus className="size-4 text-muted-foreground" />
                  <InlineInput
                    placeholder={t('workspace.enterFileName')}
                    onSubmit={name => {
                      onCreateFile(node.path, name);
                      onSetEditingNode(null);
                    }}
                    onCancel={() => onSetEditingNode(null)}
                  />
                </div>
              )}
            {editingNode?.type === 'new-dir' &&
              editingNode.parentPath === node.path && (
                <div
                  className="flex items-center gap-1.5 px-2 py-1"
                  style={{ paddingLeft: `${(depth + 1) * 16 + 8}px` }}
                >
                  <span className="size-3.5" />
                  <FolderPlus className="size-4 text-muted-foreground" />
                  <InlineInput
                    placeholder={t('workspace.enterFolderName')}
                    onSubmit={name => {
                      onCreateDirectory(node.path, name);
                      onSetEditingNode(null);
                    }}
                    onCancel={() => onSetEditingNode(null)}
                  />
                </div>
              )}
          </>
        )}
      </div>
    );
  }

  const file = node.file!;
  const Icon = getFileIcon(file.mimeType, node.name);
  const isSelected = selectedFileId === file.id;
  const isRenaming =
    editingNode?.type === 'rename-file' && editingNode.nodePath === node.path;
  const parentDir = getParentDir(node.path);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm transition-colors',
            isSelected
              ? 'bg-accent text-accent-foreground'
              : 'hover:bg-accent/50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectFile(file)}
        >
          <span className="size-3.5 shrink-0" />
          <Icon className="size-4 shrink-0 text-muted-foreground" />
          {isRenaming ? (
            <InlineInput
              defaultValue={node.name}
              selectWithoutExtension
              onSubmit={newName => {
                onRenameFile(file, newName);
                onSetEditingNode(null);
              }}
              onCancel={() => onSetEditingNode(null)}
            />
          ) : (
            <>
              <span className="truncate flex-1 text-left">{node.name}</span>
              <span className="text-muted-foreground text-[10px] shrink-0">
                {formatFileSize(file.size)}
              </span>
            </>
          )}
        </button>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem
          onClick={() =>
            onCopy({
              operation: 'copy',
              type: 'file',
              path: node.path,
              fileId: file.id,
            })
          }
        >
          <Copy className="mr-2 size-4" /> {t('common.copy')}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() =>
            onCut({
              operation: 'cut',
              type: 'file',
              path: node.path,
              fileId: file.id,
            })
          }
        >
          <Scissors className="mr-2 size-4" /> {t('workspace.cut')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          onClick={() =>
            onSetEditingNode({
              type: 'rename-file',
              parentPath: parentDir,
              nodePath: node.path,
              fileId: file.id,
            })
          }
        >
          <Pencil className="mr-2 size-4" /> {t('workspace.rename')}
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          onClick={() =>
            onSetDeleteTarget({
              type: 'file',
              name: node.name,
              path: node.path,
              file,
            })
          }
        >
          <Trash2 className="mr-2 size-4" /> {t('common.delete')}
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem onClick={() => onDownloadFile(file)}>
          <Download className="mr-2 size-4" /> {t('workspace.downloadFile')}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

interface FileTreeProps {
  readonly files: WorkspaceFileResponse[];
  readonly selectedFileId?: string;
  readonly clipboard: ClipboardItem | null;
  readonly onSelectFile: (file: WorkspaceFileResponse) => void;
  readonly onDownloadFile: (file: WorkspaceFileResponse) => void;
  readonly onCreateFile: (dirPath: string, name: string) => void;
  readonly onCreateDirectory: (dirPath: string, name: string) => void;
  readonly onRenameFile: (file: WorkspaceFileResponse, newName: string) => void;
  readonly onRenameDirectory: (dirPath: string, newName: string) => void;
  readonly onDeleteFile: (file: WorkspaceFileResponse) => void;
  readonly onDeleteDirectory: (dirPath: string) => void;
  readonly onCopy: (item: ClipboardItem) => void;
  readonly onCut: (item: ClipboardItem) => void;
  readonly onPaste: (targetDir: string) => void;
}

export function FileTree({
  files,
  selectedFileId,
  clipboard,
  onSelectFile,
  onDownloadFile,
  onCreateFile,
  onCreateDirectory,
  onRenameFile,
  onRenameDirectory,
  onDeleteFile,
  onDeleteDirectory,
  onCopy,
  onCut,
  onPaste,
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

  const [editingNode, setEditingNode] = useState<EditingNode | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

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

  const toolbar = (
    <div className="flex h-9 shrink-0 items-center justify-end gap-0.5 border-b px-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => setEditingNode({ type: 'new-file', parentPath: '' })}
          >
            <FilePlus className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{t('workspace.newFile')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            onClick={() => setEditingNode({ type: 'new-dir', parentPath: '' })}
          >
            <FolderPlus className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {t('workspace.newFolder')}
        </TooltipContent>
      </Tooltip>
    </div>
  );

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {toolbar}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8 text-muted-foreground">
          <Folder className="mb-2 size-8 opacity-40" />
          <p className="text-xs">{t('workspace.noFiles')}</p>
        </div>
        {/* Root-level inline inputs when empty */}
        {editingNode?.type === 'new-file' && editingNode.parentPath === '' && (
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ paddingLeft: '8px' }}
          >
            <span className="size-3.5" />
            <FilePlus className="size-4 text-muted-foreground" />
            <InlineInput
              placeholder={t('workspace.enterFileName')}
              onSubmit={name => {
                onCreateFile('', name);
                setEditingNode(null);
              }}
              onCancel={() => setEditingNode(null)}
            />
          </div>
        )}
        {editingNode?.type === 'new-dir' && editingNode.parentPath === '' && (
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ paddingLeft: '8px' }}
          >
            <span className="size-3.5" />
            <FolderPlus className="size-4 text-muted-foreground" />
            <InlineInput
              placeholder={t('workspace.enterFolderName')}
              onSubmit={name => {
                onCreateDirectory('', name);
                setEditingNode(null);
              }}
              onCancel={() => setEditingNode(null)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-hidden">
        {toolbar}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <ScrollArea className="min-h-0 flex-1">
              <div className="min-h-full py-1">
                {tree.map(node => (
                  <TreeNodeItem
                    key={node.path}
                    node={node}
                    depth={0}
                    selectedFileId={selectedFileId}
                    expandedDirs={expandedDirs}
                    clipboard={clipboard}
                    editingNode={editingNode}
                    onToggleDir={handleToggleDir}
                    onSelectFile={onSelectFile}
                    onDownloadFile={onDownloadFile}
                    onCopy={onCopy}
                    onCut={onCut}
                    onPaste={onPaste}
                    onSetEditingNode={setEditingNode}
                    onSetDeleteTarget={setDeleteTarget}
                    onCreateFile={onCreateFile}
                    onCreateDirectory={onCreateDirectory}
                    onRenameFile={onRenameFile}
                    onRenameDirectory={onRenameDirectory}
                  />
                ))}
                {/* New file/folder at root level */}
                {editingNode?.type === 'new-file' &&
                  editingNode.parentPath === '' && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-1"
                      style={{ paddingLeft: '8px' }}
                    >
                      <span className="size-3.5" />
                      <FilePlus className="size-4 text-muted-foreground" />
                      <InlineInput
                        placeholder={t('workspace.enterFileName')}
                        onSubmit={name => {
                          onCreateFile('', name);
                          setEditingNode(null);
                        }}
                        onCancel={() => setEditingNode(null)}
                      />
                    </div>
                  )}
                {editingNode?.type === 'new-dir' &&
                  editingNode.parentPath === '' && (
                    <div
                      className="flex items-center gap-1.5 px-2 py-1"
                      style={{ paddingLeft: '8px' }}
                    >
                      <span className="size-3.5" />
                      <FolderPlus className="size-4 text-muted-foreground" />
                      <InlineInput
                        placeholder={t('workspace.enterFolderName')}
                        onSubmit={name => {
                          onCreateDirectory('', name);
                          setEditingNode(null);
                        }}
                        onCancel={() => setEditingNode(null)}
                      />
                    </div>
                  )}
              </div>
            </ScrollArea>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-48">
            <ContextMenuItem
              onClick={() =>
                setEditingNode({ type: 'new-file', parentPath: '' })
              }
            >
              <FilePlus className="mr-2 size-4" /> {t('workspace.newFile')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                setEditingNode({ type: 'new-dir', parentPath: '' })
              }
            >
              <FolderPlus className="mr-2 size-4" /> {t('workspace.newFolder')}
            </ContextMenuItem>
            {clipboard && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onPaste('')}>
                  <ClipboardPaste className="mr-2 size-4" />{' '}
                  {t('workspace.paste')}
                </ContextMenuItem>
              </>
            )}
          </ContextMenuContent>
        </ContextMenu>
      </div>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'directory'
                ? t('workspace.confirmDeleteDir', { name: deleteTarget?.name })
                : t('workspace.confirmDelete', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteTarget?.type === 'directory') {
                  onDeleteDirectory(deleteTarget.path);
                } else if (deleteTarget?.file) {
                  onDeleteFile(deleteTarget.file);
                }
                setDeleteTarget(null);
              }}
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
