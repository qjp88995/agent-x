import type { Meta, StoryObj } from '@storybook/react-vite';

import { ToolCallBlock } from './tool-call-block';

const meta: Meta<typeof ToolCallBlock> = {
  title: 'Chat/ToolCallBlock',
  component: ToolCallBlock,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ToolCallBlock>;

export const Loading: Story = {
  args: {
    toolName: 'get_weather',
    state: 'input-streaming',
    input: { location: 'San Francisco, CA' },
  },
};

export const Completed: Story = {
  args: {
    toolName: 'get_weather',
    state: 'output-available',
    input: { location: 'San Francisco, CA' },
    output: {
      temperature: '18°C',
      condition: 'Partly cloudy',
      humidity: '72%',
    },
  },
};

export const Error: Story = {
  args: {
    toolName: 'get_weather',
    state: 'output-error',
    input: { location: 'Unknown' },
    errorText: 'Location not found. Please provide a valid city name.',
  },
};

export const WithOutput: Story = {
  args: {
    toolName: 'search_files',
    state: 'output-available',
    input: { query: 'useEffect', path: 'src/' },
    output: {
      matches: [
        { file: 'src/hooks/use-chat.ts', line: 42 },
        { file: 'src/components/chat/message-list.tsx', line: 18 },
        { file: 'src/pages/chat.tsx', line: 7 },
      ],
      total: 3,
    },
  },
};
