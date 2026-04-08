import type { Meta, StoryObj } from '@storybook/react-vite';

import { TimeCard } from './time-card';

const meta: Meta<typeof TimeCard> = {
  title: 'Chat/TimeCard',
  component: TimeCard,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="max-w-sm mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof TimeCard>;

export const Loading: Story = {
  args: {
    state: 'input-streaming',
  },
};

export const Success: Story = {
  args: {
    state: 'output-available',
    output: {
      localTime: '2026-03-18 14:32:05',
      timezone: 'America/Los_Angeles',
    },
  },
};

export const Error: Story = {
  args: {
    state: 'output-error',
    output: {
      error: 'Unable to determine timezone from location.',
    },
  },
};
