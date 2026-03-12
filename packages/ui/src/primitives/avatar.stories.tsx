import type { Meta, StoryObj } from '@storybook/react-vite';

import { Avatar } from './avatar';

const meta: Meta<typeof Avatar> = {
  title: 'Primitives/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
  args: {
    name: 'John Doe',
    size: 'md',
  },
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar name="John Doe" size="sm" />
      <Avatar name="John Doe" size="md" />
      <Avatar name="John Doe" size="lg" />
    </div>
  ),
};

export const WithImage: Story = {
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar
        name="Jane Smith"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
        size="sm"
      />
      <Avatar
        name="Jane Smith"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
        size="md"
      />
      <Avatar
        name="Jane Smith"
        src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop"
        size="lg"
      />
    </div>
  ),
};

export const FallbackColors: Story = {
  render: () => (
    <div className="flex items-center gap-2 flex-wrap">
      {[
        'Alice Chen',
        'Bob Martinez',
        'Carol White',
        'David Kim',
        'Eva Rodriguez',
        'Frank Johnson',
        'Grace Lee',
        'Henry Brown',
        'Iris Davis',
        'Jack Wilson',
      ].map((name) => (
        <Avatar key={name} name={name} size="md" />
      ))}
    </div>
  ),
};
