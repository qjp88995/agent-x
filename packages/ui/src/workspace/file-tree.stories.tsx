import type { Meta, StoryObj } from '@storybook/react-vite';

import { TooltipProvider } from '../feedback/tooltip';
import { FileTree } from './file-tree';
import type { ClipboardItem, WorkspaceFile } from './types';

const makeFile = (
  id: string,
  path: string,
  mimeType = 'text/typescript'
): WorkspaceFile => ({
  id,
  name: path.split('/').pop()!,
  path,
  mimeType,
  isDirectory: false,
  size: 1024,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
});

const flatFiles: WorkspaceFile[] = [
  makeFile('f1', 'index.ts'),
  makeFile('f2', 'README.md', 'text/markdown'),
  makeFile('f3', 'package.json', 'application/json'),
];

const nestedFiles: WorkspaceFile[] = [
  {
    id: 'd1',
    name: 'src',
    path: 'src',
    mimeType: 'inode/directory',
    isDirectory: true,
    size: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'd2',
    name: 'components',
    path: 'src/components',
    mimeType: 'inode/directory',
    isDirectory: true,
    size: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  makeFile('f4', 'src/index.ts'),
  makeFile('f5', 'src/components/Button.tsx'),
  makeFile('f6', 'src/components/Input.tsx'),
  makeFile('f7', 'README.md', 'text/markdown'),
];

const baseArgs = {
  files: [] as WorkspaceFile[],
  selectedFileId: undefined,
  clipboard: null,
  onSelectFile: (_file: WorkspaceFile) => {},
  onDownloadFile: (_file: WorkspaceFile) => {},
  onCreateFile: (_dirPath: string, _name: string) => {},
  onCreateDirectory: (_dirPath: string, _name: string) => {},
  onRenameFile: (_file: WorkspaceFile, _newName: string) => {},
  onRenameDirectory: (_dirPath: string, _newName: string) => {},
  onDeleteFile: (_file: WorkspaceFile) => {},
  onDeleteDirectory: (_dirPath: string) => {},
  onCopy: (_item: ClipboardItem) => {},
  onCut: (_item: ClipboardItem) => {},
  onPaste: (_targetDir: string) => {},
};

const meta: Meta<typeof FileTree> = {
  title: 'Workspace/FileTree',
  component: FileTree,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <TooltipProvider>
        <div className="h-[600px] w-64 border">
          <Story />
        </div>
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileTree>;

export const Empty: Story = {
  args: { ...baseArgs, files: [] },
};

export const WithFiles: Story = {
  args: { ...baseArgs, files: flatFiles },
};

export const NestedDirectories: Story = {
  args: { ...baseArgs, files: nestedFiles },
};
