import type { Meta, StoryObj } from '@storybook/react-vite';

import { Separator } from './separator';

const meta: Meta<typeof Separator> = {
  title: 'Primitives/Separator',
  component: Separator,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-60">
      <p className="text-sm text-foreground-secondary">Section A</p>
      <Separator className="my-3" />
      <p className="text-sm text-foreground-secondary">Section B</p>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-6 items-center gap-3">
      <span className="text-sm">Home</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Settings</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Profile</span>
    </div>
  ),
};
