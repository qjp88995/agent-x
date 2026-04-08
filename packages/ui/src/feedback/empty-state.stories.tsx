import type { Meta, StoryObj } from '@storybook/react-vite';
import { Inbox, Plus, Search, Settings } from 'lucide-react';

import { Button } from '../primitives/button';
import { EmptyState } from './empty-state';

const meta: Meta<typeof EmptyState> = {
  title: 'Feedback/EmptyState',
  component: EmptyState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

export const Default: Story = {
  render: () => <EmptyState icon={Inbox} title="No items found" />,
};

export const WithDescription: Story = {
  render: () => (
    <EmptyState
      icon={Search}
      title="No results"
      description="Try adjusting your search or filter to find what you're looking for."
    />
  ),
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
      icon={Inbox}
      title="No agents yet"
      description="Create your first agent to get started."
      action={
        <Button variant="primary">
          <Plus className="mr-2 size-4" />
          Create Agent
        </Button>
      }
    />
  ),
};

export const WithCustomIcon: Story = {
  render: () => (
    <EmptyState
      icon={Settings}
      title="No configuration"
      description="Configure your settings to enable this feature."
      action={<Button variant="outline">Open Settings</Button>}
    />
  ),
};

export const WithClassName: Story = {
  render: () => (
    <EmptyState
      icon={Inbox}
      title="Custom styled"
      description="This empty state has a custom background color."
      className="bg-muted/30"
    />
  ),
};
