import type { Meta, StoryObj } from '@storybook/react-vite';

import { FileChip } from './file-chip';

const meta: Meta<typeof FileChip> = {
  title: 'Chat/FileChip',
  component: FileChip,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['file', 'image'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof FileChip>;

export const File: Story = {
  args: {
    name: 'document.pdf',
    size: '2.4 MB',
    type: 'file',
  },
};

export const Image: Story = {
  args: {
    name: 'screenshot.png',
    size: '1.2 MB',
    type: 'image',
  },
};

export const WithRemove: Story = {
  args: {
    name: 'report.csv',
    size: '340 KB',
    type: 'file',
    onRemove: () => console.log('remove'),
  },
};

export const LongName: Story = {
  args: {
    name: 'very-long-filename-that-should-be-truncated.tsx',
    size: '12 KB',
    type: 'file',
    onRemove: () => console.log('remove'),
  },
};

export const Multiple: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <FileChip
        name="index.tsx"
        size="4 KB"
        type="file"
        onRemove={() => {}}
      />
      <FileChip
        name="photo.jpg"
        size="1.8 MB"
        type="image"
        onRemove={() => {}}
      />
      <FileChip
        name="data.json"
        size="256 KB"
        type="file"
        onRemove={() => {}}
      />
    </div>
  ),
};
