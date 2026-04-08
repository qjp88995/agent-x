import type { Meta, StoryObj } from '@storybook/react-vite';

import { InlineInput } from './inline-input';

const meta: Meta<typeof InlineInput> = {
  title: 'Workspace/InlineInput',
  component: InlineInput,
  tags: ['autodocs'],
  args: {
    onSubmit: () => {},
    onCancel: () => {},
  },
  decorators: [
    Story => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InlineInput>;

export const Default: Story = {
  args: {
    placeholder: 'Enter file name',
  },
};

export const Rename: Story = {
  args: {
    defaultValue: 'index.ts',
    selectWithoutExtension: true,
    placeholder: 'Rename file',
  },
};

export const WithValidationError: Story = {
  name: 'WithValidationError (type a duplicate to see error)',
  args: {
    placeholder: 'Enter file name',
    existingNames: ['index.ts', 'README.md', 'package.json'],
  },
};
