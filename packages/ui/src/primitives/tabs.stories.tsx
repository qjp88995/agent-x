import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

const meta: Meta = {
  title: 'Primitives/Tabs',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-96">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
      </TabsList>
      <TabsContent value="general">
        <p className="pt-3 text-sm text-foreground-secondary">
          General settings for your account.
        </p>
      </TabsContent>
      <TabsContent value="security">
        <p className="pt-3 text-sm text-foreground-secondary">
          Manage your security preferences.
        </p>
      </TabsContent>
      <TabsContent value="notifications">
        <p className="pt-3 text-sm text-foreground-secondary">
          Configure notification settings.
        </p>
      </TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="active" className="w-96">
      <TabsList>
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="disabled" disabled>
          Disabled
        </TabsTrigger>
        <TabsTrigger value="other">Other</TabsTrigger>
      </TabsList>
      <TabsContent value="active">
        <p className="pt-3 text-sm text-foreground-secondary">Active tab content.</p>
      </TabsContent>
      <TabsContent value="other">
        <p className="pt-3 text-sm text-foreground-secondary">Other tab content.</p>
      </TabsContent>
    </Tabs>
  ),
};
