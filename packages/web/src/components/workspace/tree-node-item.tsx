import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import type { WorkspaceFileResponse } from '@agent-x/shared';
import {
  ChevronDown,
  ChevronRight,
  ClipboardPaste,
  Copy,
  Download,
  FilePlus,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Scissors,
  Trash2,
} from 'lucide-react';

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { cn } from '@/lib/utils';

import type { ClipboardItem } from './file-tree';
import type { TreeNode } from './file-tree-utils';
import { formatFileSize, getFileIcon, getParentDir } from './file-tree-utils';
import { InlineInput } from './inline-input';

export interface EditingNode {
  readonly type: 'rename-file' | 'rename-dir' | 'new-file' | 'new-dir';
  readonly parentPath: string;
  readonly nodePath?: string;
  readonly fileId?: string;
}

export interface DeleteTarget {
  readonly type: 'file' | 'directory';
  readonly name: string;
  readonly path: string;
  readonly file?: WorkspaceFileResponse;
}

export interface TreeNodeItemProps {
  readonly node: TreeNode;
  readonly depth: number;
  readonly siblingNames: readonly string[];
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

export const TreeNodeItem = memo(function TreeNodeItem({
  node,
  depth,
  siblingNames,
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
              className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-sm hover:bg-card/50 transition-colors"
              style={{ paddingLeft: `${depth * 16 + 8}px` }}
              onClick={() => onToggleDir(node.path)}
            >
              {isExpanded ? (
                <ChevronDown className="size-3.5 shrink-0 text-foreground-muted" />
              ) : (
                <ChevronRight className="size-3.5 shrink-0 text-foreground-muted" />
              )}
              {isExpanded ? (
                <FolderOpen className="size-4 shrink-0 text-primary/70" />
              ) : (
                <Folder className="size-4 shrink-0 text-primary/70" />
              )}
              {isRenaming ? (
                <InlineInput
                  defaultValue={node.name}
                  existingNames={siblingNames.filter(n => n !== node.name)}
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
                siblingNames={node.children.map(c => c.name)}
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
                  <FilePlus className="size-4 text-foreground-muted" />
                  <InlineInput
                    placeholder={t('workspace.enterFileName')}
                    existingNames={node.children.map(c => c.name)}
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
                  <FolderPlus className="size-4 text-foreground-muted" />
                  <InlineInput
                    placeholder={t('workspace.enterFolderName')}
                    existingNames={node.children.map(c => c.name)}
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
              ? 'bg-card text-foreground-secondary'
              : 'hover:bg-card/50'
          )}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => onSelectFile(file)}
        >
          <span className="size-3.5 shrink-0" />
          <Icon className="size-4 shrink-0 text-foreground-muted" />
          {isRenaming ? (
            <InlineInput
              defaultValue={node.name}
              selectWithoutExtension
              existingNames={siblingNames.filter(n => n !== node.name)}
              onSubmit={newName => {
                onRenameFile(file, newName);
                onSetEditingNode(null);
              }}
              onCancel={() => onSetEditingNode(null)}
            />
          ) : (
            <>
              <span className="truncate flex-1 text-left">{node.name}</span>
              <span className="text-foreground-muted text-[10px] shrink-0">
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
});
