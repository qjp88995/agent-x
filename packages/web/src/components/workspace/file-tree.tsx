import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { WorkspaceFileResponse } from '@agent-x/shared';
import { ClipboardPaste, FilePlus, Folder, FolderPlus } from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

import { buildTree } from './file-tree-utils';
import { InlineInput } from './inline-input';
import type { DeleteTarget, EditingNode } from './tree-node-item';
import { TreeNodeItem } from './tree-node-item';

export type { DeleteTarget, EditingNode };

export interface ClipboardItem {
  readonly operation: 'copy' | 'cut';
  readonly type: 'file' | 'directory';
  readonly path: string;
  readonly fileId?: string;
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
    <div className="flex h-9 shrink-0 items-center gap-0.5 border-b px-2">
      <span className="flex-1 truncate px-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {t('workspace.files')}
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
        <TooltipContent side="bottom">{t('workspace.newFile')}</TooltipContent>
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
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center py-8 text-foreground-muted">
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
            <FilePlus className="size-4 text-foreground-muted" />
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
            <FolderPlus className="size-4 text-foreground-muted" />
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
                    siblingNames={tree.map(n => n.name)}
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
                      <FilePlus className="size-4 text-foreground-muted" />
                      <InlineInput
                        placeholder={t('workspace.enterFileName')}
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
                        placeholder={t('workspace.enterFolderName')}
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
