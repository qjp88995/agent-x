import type { Meta, StoryObj } from '@storybook/react-vite';
import { MessageBubble, CodeBlock } from './message-bubble';

const meta: Meta<typeof MessageBubble> = {
  title: 'Chat/MessageBubble',
  component: MessageBubble,
  tags: ['autodocs'],
  argTypes: {
    role: {
      control: 'select',
      options: ['user', 'assistant'],
    },
    streaming: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MessageBubble>;

export const UserMessage: Story = {
  args: {
    role: 'user',
    children: 'How do I implement a binary search tree in TypeScript?',
  },
};

export const AIMessage: Story = {
  args: {
    role: 'assistant',
    avatar: { name: 'Agent X' },
    children:
      'A binary search tree (BST) is a data structure where each node has at most two children. The left child contains values less than the parent node, and the right child contains values greater than the parent node.',
  },
};

export const AIWithCode: Story = {
  render: () => (
    <MessageBubble role="assistant" avatar={{ name: 'Agent X' }}>
      <p>Here is a TypeScript implementation of a binary search tree node:</p>
      <CodeBlock className="language-typescript">{`interface TreeNode<T> {
  value: T;
  left: TreeNode<T> | null;
  right: TreeNode<T> | null;
}

function insert<T>(root: TreeNode<T> | null, value: T): TreeNode<T> {
  if (root === null) {
    return { value, left: null, right: null };
  }
  if (value < root.value) {
    return { ...root, left: insert(root.left, value) };
  }
  return { ...root, right: insert(root.right, value) };
}`}</CodeBlock>
      <p>This uses immutable patterns — each insert returns a new tree rather than mutating in place.</p>
    </MessageBubble>
  ),
};

export const AIStreaming: Story = {
  args: {
    role: 'assistant',
    avatar: { name: 'Agent X' },
    streaming: true,
    children: 'Let me think about that',
  },
};

export const ConversationThread: Story = {
  render: () => (
    <div className="space-y-4">
      <MessageBubble role="user">
        What is the time complexity of quicksort?
      </MessageBubble>
      <MessageBubble role="assistant" avatar={{ name: 'Agent X' }}>
        Quicksort has an average time complexity of <strong>O(n log n)</strong>, but its worst-case
        complexity is <strong>O(n²)</strong> when the pivot selection consistently picks the smallest
        or largest element.
      </MessageBubble>
      <MessageBubble role="user">
        How can I avoid the worst case?
      </MessageBubble>
      <MessageBubble role="assistant" avatar={{ name: 'Agent X' }} streaming>
        You can use randomized pivot selection
      </MessageBubble>
    </div>
  ),
};
