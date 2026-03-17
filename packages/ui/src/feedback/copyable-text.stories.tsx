import type { Meta, StoryObj } from '@storybook/react-vite';

import { TooltipProvider } from './tooltip';
import { CopyableText } from './copyable-text';

const meta: Meta<typeof CopyableText> = {
  title: 'Feedback/CopyableText',
  component: CopyableText,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <TooltipProvider>
        <Story />
      </TooltipProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CopyableText>;

export const Default: Story = {
  render: () => (
    <CopyableText text="a1b2c3d4-e5f6-7890-abcd-ef1234567890" />
  ),
};

export const WithTruncation: Story = {
  render: () => (
    <CopyableText text="a1b2c3d4-e5f6-7890-abcd-ef1234567890" truncate={8} />
  ),
};

export const WithLabel: Story = {
  render: () => (
    <CopyableText
      text="a1b2c3d4-e5f6-7890-abcd-ef1234567890"
      label="ID:"
      truncate={8}
    />
  ),
};

export const CustomLabels: Story = {
  render: () => (
    <CopyableText
      text="sk-1234567890abcdef"
      truncate={10}
      copyLabel="Copy API key"
      copiedLabel="API key copied!"
    />
  ),
};

export const FullText: Story = {
  render: () => (
    <CopyableText text="short-key" />
  ),
};
