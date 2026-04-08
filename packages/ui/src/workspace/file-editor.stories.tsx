import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileEditor } from './file-editor';
import type { OpenTab, WorkspaceFile } from './types';
import type { HttpClient } from './workspace-api-context';
import { WorkspaceApiProvider } from './workspace-api-context';

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

const file1 = makeFile('f1', 'src/index.ts');
const file2 = makeFile('f2', 'src/utils.ts');

const tab1: OpenTab = { file: file1, modified: false };
const tab2: OpenTab = { file: file2, modified: true };

const meta: Meta<typeof FileEditor> = {
  title: 'Workspace/FileEditor',
  component: FileEditor,
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
    onSelectTab: (_fileId: string) => {},
    onCloseTab: (_fileId: string) => {},
    onTabModified: (_fileId: string, _modified: boolean) => {},
  },
};

export default meta;
type Story = StoryObj<typeof FileEditor>;

export const NoTabs: Story = {
  args: {
    tabs: [],
    activeFileId: undefined,
  },
};

export const WithTabs: Story = {
  args: {
    tabs: [tab1],
    activeFileId: 'f1',
  },
};

export const MultipleTabs: Story = {
  args: {
    tabs: [tab1, tab2],
    activeFileId: 'f1',
  },
};
