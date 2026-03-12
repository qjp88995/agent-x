import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Label> = {
  title: 'Primitives/Label',
  component: Label,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  args: {
    children: 'Email address',
  },
};

export const WithInput: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="email">Email</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Required: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="name">
        Name <span className="text-destructive">*</span>
      </Label>
      <Input id="name" placeholder="Your name" />
    </div>
  ),
};
