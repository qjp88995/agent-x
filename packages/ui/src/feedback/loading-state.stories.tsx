import type { Meta, StoryObj } from '@storybook/react-vite';

import { LoadingState } from './loading-state';

const meta: Meta<typeof LoadingState> = {
  title: 'Feedback/LoadingState',
  component: LoadingState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof LoadingState>;

export const Default: Story = {
  render: () => <LoadingState message="Loading..." />,
};

export const CustomMessage: Story = {
  render: () => <LoadingState message="Fetching agents, please wait..." />,
};

export const WithClassName: Story = {
  render: () => (
    <LoadingState message="Loading data..." className="bg-muted/30 rounded-lg" />
  ),
};

export const MinimalPadding: Story = {
  render: () => (
    <LoadingState message="Loading..." className="py-4" />
  ),
};
