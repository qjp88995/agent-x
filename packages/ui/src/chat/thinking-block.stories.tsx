import type { Meta, StoryObj } from '@storybook/react-vite';

import { ThinkingBlock } from './thinking-block';

const meta: Meta<typeof ThinkingBlock> = {
  title: 'Chat/ThinkingBlock',
  component: ThinkingBlock,
  tags: ['autodocs'],
  argTypes: {
    duration: { control: 'number' },
    defaultOpen: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ThinkingBlock>;

export const Collapsed: Story = {
  args: {
    duration: 4,
    defaultOpen: false,
    children:
      'The user is asking about binary search trees. I should explain the concept clearly and provide a TypeScript implementation. I need to consider immutable patterns as per the coding guidelines — each operation should return a new tree rather than mutating the existing one.',
  },
};

export const Expanded: Story = {
  args: {
    duration: 7,
    defaultOpen: true,
    children:
      'Let me break this down step by step. First, I need to understand the time complexity requirements. For a balanced BST: insert is O(log n), search is O(log n), delete is O(log n). For an unbalanced BST in the worst case, these degrade to O(n). The user likely wants a self-balancing variant like AVL or Red-Black tree for production use.',
  },
};

export const InProgress: Story = {
  args: {
    defaultOpen: false,
    children: 'Still processing...',
  },
};

export const InProgressExpanded: Story = {
  args: {
    defaultOpen: true,
    children:
      'Analyzing the request... considering multiple approaches... evaluating trade-offs between readability and performance...',
  },
};
