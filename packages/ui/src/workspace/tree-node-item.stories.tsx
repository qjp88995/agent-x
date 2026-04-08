import type { Meta, StoryObj } from '@storybook/react-vite';

import type { TreeNode } from './file-tree-utils';
import { TreeNodeItem } from './tree-node-item';
import type { WorkspaceFile } from './types';

const makeFile = (id: string, path: string): WorkspaceFile => ({
  id,
  name: path.split('/').pop()!,
  path,
  mimeType: 'text/typescript',
  isDirectory: false,
  size: 1024,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const indexFile = makeFile('file-1', 'src/index.ts');

const fileNode: TreeNode = {
  name: 'index.ts',
  path: 'src/index.ts',
  isDirectory: false,
  file: indexFile,
  children: [],
};

const dirNode: TreeNode = {
  name: 'src',
  path: 'src',
  isDirectory: true,
  children: [fileNode],
};

const baseArgs = {
  depth: 0,
  siblingNames: ['index.ts', 'README.md'] as readonly string[],
  selectedFileId: undefined,
  expandedDirs: new Set<string>() as ReadonlySet<string>,
  clipboard: null,
  editingNode: null,
  onToggleDir: (_path: string) => {},
  onSelectFile: (_file: WorkspaceFile) => {},
  onDownloadFile: (_file: WorkspaceFile) => {},
  onCopy: (_item: import('./types').ClipboardItem) => {},
  onCut: (_item: import('./types').ClipboardItem) => {},
  onPaste: (_targetDir: string) => {},
  onSetEditingNode: (
    _node: import('./tree-node-item').EditingNode | null
  ) => {},
  onSetDeleteTarget: (
    _target: import('./tree-node-item').DeleteTarget | null
  ) => {},
  onCreateFile: (_dirPath: string, _name: string) => {},
  onCreateDirectory: (_dirPath: string, _name: string) => {},
  onRenameFile: (_file: WorkspaceFile, _newName: string) => {},
  onRenameDirectory: (_dirPath: string, _newName: string) => {},
};

const meta: Meta<typeof TreeNodeItem> = {
  title: 'Workspace/TreeNodeItem',
  component: TreeNodeItem,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="w-64 rounded border">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TreeNodeItem>;

export const FileNode: Story = {
  args: { ...baseArgs, node: fileNode },
};

export const FileNodeSelected: Story = {
  args: { ...baseArgs, node: fileNode, selectedFileId: 'file-1' },
};

export const DirectoryNode: Story = {
  args: { ...baseArgs, node: dirNode },
};

export const DirectoryNodeExpanded: Story = {
  args: {
    ...baseArgs,
    node: dirNode,
    expandedDirs: new Set(['src']) as ReadonlySet<string>,
  },
};

export const FileNodeRenaming: Story = {
  args: {
    ...baseArgs,
    node: fileNode,
    editingNode: {
      type: 'rename-file',
      parentPath: 'src',
      nodePath: 'src/index.ts',
      fileId: 'file-1',
    },
  },
};
