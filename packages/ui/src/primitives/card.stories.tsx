import type { Meta, StoryObj } from '@storybook/react-vite';

import { Button } from './button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './card';

const meta: Meta = {
  title: 'Primitives/Card',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Card Title</CardTitle>
        <CardDescription>
          This is a description of the card content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground-secondary">
          Card body content goes here. You can put any content inside.
        </p>
      </CardContent>
    </Card>
  ),
};

export const WithFooter: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Create Agent</CardTitle>
        <CardDescription>
          Configure a new AI agent with custom settings.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground-secondary">
          Fill in the details below to create your agent.
        </p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="primary">Create</Button>
      </CardFooter>
    </Card>
  ),
};

export const WithAction: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>Manage your notification preferences.</CardDescription>
        <CardAction>
          <Button variant="outline" size="sm">
            Settings
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground-secondary">
          You have 3 unread notifications.
        </p>
      </CardContent>
    </Card>
  ),
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-4">
      {['Code Assistant', 'Doc Writer', 'Test Runner'].map(name => (
        <Card key={name}>
          <CardHeader>
            <CardTitle>{name}</CardTitle>
            <CardDescription>An AI-powered agent</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground-secondary">
              Ready to help with your tasks.
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  ),
};
