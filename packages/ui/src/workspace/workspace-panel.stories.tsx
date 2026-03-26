import type { Meta, StoryObj } from '@storybook/react-vite';

import type { WorkspaceFile } from './types';
import type { HttpClient } from './workspace-api-context';
import { WorkspaceApiProvider } from './workspace-api-context';
import { WorkspacePanel } from './workspace-panel';

const mockClient = {
  get: async (_url: string) => ({
    data: {
      content: '// Hello from TypeScript\nconst x = 42;\nexport default x;\n',
    },
  }),
  post: async () => ({ data: {} }),
  put: async () => ({ data: {} }),
  patch: async () => ({ data: {} }),
  delete: async () => ({ data: {} }),
} as unknown as HttpClient;

const mockFilesUrl = (id: string) => `/conversations/${id}/files`;
const mockDownloadUrl = (id: string, fid: string) =>
  `/api/conversations/${id}/files/${fid}/download`;

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

const mockFiles: WorkspaceFile[] = [
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
  makeFile('f1', 'src/index.ts'),
  makeFile('f2', 'src/utils.ts'),
  makeFile('f3', 'README.md', 'text/markdown'),
];

const meta: Meta<typeof WorkspacePanel> = {
  title: 'Workspace/WorkspacePanel',
  component: WorkspacePanel,
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <WorkspaceApiProvider
        client={mockClient}
        filesUrl={mockFilesUrl}
        downloadUrl={mockDownloadUrl}
      >
        <div className="h-[600px]">
          <Story />
        </div>
      </WorkspaceApiProvider>
    ),
  ],
  args: {
    conversationId: 'story-conversation-1',
    onCreateFile: async (_dirPath: string, _name: string) => {},
    onCreateDirectory: async (_dirPath: string, _name: string) => {},
    onDeleteFile: async (_file: WorkspaceFile) => {},
    onDeleteDirectory: async (_dirPath: string) => {},
    onRenameFile: async (_file: WorkspaceFile, _newName: string) => {},
    onRenameDirectory: async (_dirPath: string, _newName: string) => {},
    onPaste: async (
      _source: { path: string; fileId?: string; type: 'file' | 'directory' },
      _targetDir: string,
      _operation: 'copy' | 'cut'
    ) => {},
    onDownloadFile: (_file: WorkspaceFile) => {},
    onDownloadWorkspace: () => {},
  },
};

export default meta;
type Story = StoryObj<typeof WorkspacePanel>;

export const Empty: Story = {
  args: { files: [] },
};

export const WithFiles: Story = {
  args: { files: mockFiles },
};
