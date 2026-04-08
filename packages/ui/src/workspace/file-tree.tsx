import { useCallback, useMemo, useState } from 'react';

import { ClipboardPaste, FilePlus, Folder, FolderPlus } from 'lucide-react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../feedback/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '../feedback/tooltip';
import { Button } from '../primitives/button';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '../primitives/context-menu';
import { ScrollArea } from '../primitives/scroll-area';
import { buildTree } from './file-tree-utils';
import { InlineInput } from './inline-input';
import type { DeleteTarget, EditingNode } from './tree-node-item';
import { type FileTreeLabels, TreeNodeItem } from './tree-node-item';
import type { ClipboardItem, WorkspaceFile } from './types';

export type { DeleteTarget, EditingNode };

type FileTreeExtendedLabels = FileTreeLabels & {
  readonly files?: string;
  readonly noFiles?: string;
  readonly enterFileName?: string;
  readonly enterFolderName?: string;
  readonly confirmDelete?: string;
  readonly confirmDeleteDir?: string;
  readonly cancel?: string;
  readonly delete?: string;
};

const DEFAULT_EXTENDED_LABELS: Required<FileTreeExtendedLabels> = {
  newFile: '新文件',
  newFolder: '新文件夹',
  rename: '重命名',
  delete: '删除',
  copy: '复制',
  cut: '剪切',
  paste: '粘贴',
  download: '下载',
  files: '文件',
  noFiles: '暂无文件',
  enterFileName: '输入文件名',
  enterFolderName: '输入文件夹名',
  confirmDelete: '确认删除此文件吗？',
  confirmDeleteDir: '确认删除此文件夹及其所有内容吗？',
  cancel: '取消',
};

interface FileTreeProps {
  readonly files: WorkspaceFile[];
  readonly selectedFileId?: string;
  readonly clipboard: ClipboardItem | null;
  readonly labels?: FileTreeExtendedLabels;
  readonly onSelectFile: (file: WorkspaceFile) => void;
  readonly onDownloadFile: (file: WorkspaceFile) => void;
  readonly onCreateFile: (dirPath: string, name: string) => void;
  readonly onCreateDirectory: (dirPath: string, name: string) => void;
  readonly onRenameFile: (file: WorkspaceFile, newName: string) => void;
  readonly onRenameDirectory: (dirPath: string, newName: string) => void;
  readonly onDeleteFile: (file: WorkspaceFile) => void;
  readonly onDeleteDirectory: (dirPath: string) => void;
  readonly onCopy: (item: ClipboardItem) => void;
  readonly onCut: (item: ClipboardItem) => void;
  readonly onPaste: (targetDir: string) => void;
}

export function FileTree({
  files,
  selectedFileId,
  clipboard,
  labels,
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
  const l = { ...DEFAULT_EXTENDED_LABELS, ...labels };
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
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b px-2">
      <span className="flex-1 truncate px-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {l.files}
      </span>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setEditingNode({ type: 'new-file', parentPath: '' })}
          >
            <FilePlus className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{l.newFile}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-6"
            onClick={() => setEditingNode({ type: 'new-dir', parentPath: '' })}
          >
            <FolderPlus className="size-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">{l.newFolder}</TooltipContent>
      </Tooltip>
    </div>
  );

  if (files.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        {toolbar}
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8 text-foreground-muted">
          <Folder className="mb-2 size-8 opacity-40" />
          <p className="text-xs">{l.noFiles}</p>
        </div>
        {/* Root-level inline inputs when empty */}
        {editingNode?.type === 'new-file' && editingNode.parentPath === '' && (
          <div
            className="flex items-center gap-1.5 px-2 py-1"
            style={{ paddingLeft: '8px' }}
          >
            <span className="size-3.5" />
            <FilePlus className="size-4 text-foreground-muted" />
            <InlineInput
              placeholder={l.enterFileName}
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
            <FolderPlus className="size-4 text-foreground-muted" />
            <InlineInput
              placeholder={l.enterFolderName}
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
                    siblingNames={tree.map(n => n.name)}
                    selectedFileId={selectedFileId}
                    expandedDirs={expandedDirs}
                    clipboard={clipboard}
                    editingNode={editingNode}
                    labels={labels}
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
                      <FilePlus className="size-4 text-foreground-muted" />
                      <InlineInput
                        placeholder={l.enterFileName}
                        existingNames={tree.map(n => n.name)}
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
                      <FolderPlus className="size-4 text-foreground-muted" />
                      <InlineInput
                        placeholder={l.enterFolderName}
                        existingNames={tree.map(n => n.name)}
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
              <FilePlus className="mr-2 size-4" /> {l.newFile}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() =>
                setEditingNode({ type: 'new-dir', parentPath: '' })
              }
            >
              <FolderPlus className="mr-2 size-4" /> {l.newFolder}
            </ContextMenuItem>
            {clipboard && (
              <>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => onPaste('')}>
                  <ClipboardPaste className="mr-2 size-4" /> {l.paste}
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
            <AlertDialogTitle>{l.delete}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === 'directory'
                ? l.confirmDeleteDir
                : l.confirmDelete}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{l.cancel}</AlertDialogCancel>
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
              {l.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
