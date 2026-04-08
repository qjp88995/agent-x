import type { Meta, StoryObj } from '@storybook/react-vite';
import { AlertCircle, Ban, WifiOff } from 'lucide-react';

import { ErrorState } from './error-state';

const meta: Meta<typeof ErrorState> = {
  title: 'Feedback/ErrorState',
  component: ErrorState,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ErrorState>;

export const Default: Story = {
  render: () => (
    <ErrorState
      title="Something went wrong"
      description="An unexpected error occurred. Please try again."
    />
  ),
};

export const WithAction: Story = {
  render: () => (
    <ErrorState
      title="Something went wrong"
      description="An unexpected error occurred. Please try again."
      actionLabel="Go Back"
      onAction={() => alert('Go back clicked')}
    />
  ),
};

export const NotFound: Story = {
  render: () => (
    <ErrorState
      title="Agent not found"
      description="The agent you are looking for does not exist or has been deleted."
      actionLabel="Back to Agents"
      onAction={() => alert('Navigate back')}
    />
  ),
};

export const CustomIcon: Story = {
  render: () => (
    <ErrorState
      icon={WifiOff}
      title="Connection lost"
      description="Unable to connect to the server. Check your network connection."
      actionLabel="Retry"
      onAction={() => alert('Retry clicked')}
    />
  ),
};

export const WithAlertCircle: Story = {
  render: () => (
    <ErrorState
      icon={AlertCircle}
      title="Access denied"
      description="You do not have permission to view this resource."
    />
  ),
};

export const WithBanIcon: Story = {
  render: () => (
    <ErrorState
      icon={Ban}
      title="Feature disabled"
      description="This feature has been disabled by your administrator."
      actionLabel="Contact Admin"
      onAction={() => alert('Contact admin')}
    />
  ),
};
