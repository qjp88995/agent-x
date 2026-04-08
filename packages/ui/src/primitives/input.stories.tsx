import type { Meta, StoryObj } from '@storybook/react-vite';
import { Check } from 'lucide-react';

import { Input } from './input';
import { Label } from './label';

const meta: Meta<typeof Input> = {
  title: 'Primitives/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="email">Email address</Label>
      <Input id="email" type="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="error-input">Username</Label>
      <Input
        id="error-input"
        placeholder="Enter username"
        defaultValue="bad value"
        className="border-destructive focus-visible:border-destructive"
      />
      <span className="text-xs text-destructive">
        Username is already taken.
      </span>
    </div>
  ),
};

export const Valid: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="valid-input">Username</Label>
      <div className="relative">
        <Input
          id="valid-input"
          placeholder="Enter username"
          defaultValue="available_user"
          className="pr-8"
        />
        <Check className="absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-primary" />
      </div>
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    placeholder: 'Disabled input',
    disabled: true,
    defaultValue: 'Cannot edit this',
  },
};

export const WithHint: Story = {
  render: () => (
    <div className="flex flex-col gap-1.5 w-64">
      <Label htmlFor="hint-input">API Key</Label>
      <Input id="hint-input" placeholder="sk-..." type="password" />
      <span className="text-xs text-foreground-dim">
        Your API key is stored encrypted and never shared.
      </span>
    </div>
  ),
};
