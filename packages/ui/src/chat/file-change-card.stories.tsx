import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileChangeCard } from './file-change-card';

const meta: Meta<typeof FileChangeCard> = {
  title: 'Chat/FileChangeCard',
  component: FileChangeCard,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="max-w-lg mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof FileChangeCard>;

export const SingleFile: Story = {
  args: {
    changes: [
      { path: 'src/components/chat/message-list.tsx', operation: 'updated' },
    ],
  },
};

export const MultipleFiles: Story = {
  args: {
    changes: [
      { path: 'src/components/chat/message-list.tsx', operation: 'updated' },
      { path: 'src/components/chat/message-item.tsx', operation: 'created' },
      { path: 'src/components/chat/old-renderer.tsx', operation: 'deleted' },
      { path: 'src/hooks/use-chat.ts', operation: 'updated' },
      { path: 'src/pages/chat.tsx', operation: 'updated' },
    ],
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    changes: [{ path: 'src/lib/workspace-utils.ts', operation: 'updated' }],
  },
};

export const WithClickHandler: Story = {
  args: {
    changes: [
      { path: 'src/components/workspace/file-tree.tsx', operation: 'read' },
      { path: 'src/lib/workspace-utils.ts', operation: 'searched' },
      { path: 'src/hooks/use-workspace.ts', operation: 'updated' },
    ],
    onClickFile: (path: string) => {
      console.log('Clicked file:', path);
    },
  },
};
