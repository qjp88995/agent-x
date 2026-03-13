import type { Meta, StoryObj } from '@storybook/react-vite';
import { Loader2, Plus } from 'lucide-react';

import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'Primitives/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'default', 'outline', 'ghost', 'destructive'],
    },
    size: {
      control: 'select',
      options: ['default', 'sm', 'lg', 'icon', 'icon-sm'],
    },
    disabled: { control: 'boolean' },
    asChild: { control: false },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: 'Button',
    variant: 'default',
    size: 'default',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary">Primary</Button>
      <Button variant="default">Default</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Destructive</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary" size="lg">
        Large
      </Button>
      <Button variant="primary" size="default">
        Default
      </Button>
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary" size="icon">
        <Plus />
      </Button>
      <Button variant="primary" size="icon-sm">
        <Plus />
      </Button>
      <Button variant="primary" size="icon-lg">
        <Plus />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary">
        <Plus />
        New Item
      </Button>
      <Button variant="outline">
        <Plus />
        Add
      </Button>
      <Button variant="ghost">
        <Plus />
        Create
      </Button>
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary" disabled>
        <Loader2 className="animate-spin" />
        Loading...
      </Button>
      <Button variant="outline" disabled>
        <Loader2 className="animate-spin" />
        Saving...
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex items-center gap-3 flex-wrap">
      <Button variant="primary" disabled>
        Primary
      </Button>
      <Button variant="default" disabled>
        Default
      </Button>
      <Button variant="outline" disabled>
        Outline
      </Button>
      <Button variant="ghost" disabled>
        Ghost
      </Button>
      <Button variant="destructive" disabled>
        Destructive
      </Button>
    </div>
  ),
};
