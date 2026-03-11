import type { Meta, StoryObj } from '@storybook/react';
import { toast } from 'sonner';
import { Button } from '../primitives/button';
import { Toaster } from './toast';

const meta: Meta = {
  title: 'Feedback/Toast',
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <>
        <Toaster />
        <Story />
      </>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Success: Story = {
  render: () => (
    <Button onClick={() => toast.success('Agent created successfully')}>
      Show Success
    </Button>
  ),
};

export const Error: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.error('Failed to delete agent')}
    >
      Show Error
    </Button>
  ),
};

export const Warning: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.warning('API key expires in 7 days')}
    >
      Show Warning
    </Button>
  ),
};

export const Info: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => toast.info('New version available')}
    >
      Show Info
    </Button>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() =>
        toast.success('Agent created successfully', {
          description: 'Your agent is now active and ready to use.',
        })
      }
    >
      Show With Description
    </Button>
  ),
};

export const Stacked: Story = {
  render: () => (
    <Button
      variant="outline"
      onClick={() => {
        toast.success('Agent created successfully');
        toast.error('Failed to sync model list');
        toast.info('New version available');
      }}
    >
      Show 3 Toasts
    </Button>
  ),
};
