import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './label';
import { Switch } from './switch';

const meta: Meta<typeof Switch> = {
  title: 'Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
  args: {},
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Switch id="airplane-mode" />
      <Label htmlFor="airplane-mode">Airplane Mode</Label>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Switch id="disabled-off" disabled />
        <Label htmlFor="disabled-off">Disabled off</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch id="disabled-on" disabled defaultChecked />
        <Label htmlFor="disabled-on">Disabled on</Label>
      </div>
    </div>
  ),
};

export const SettingsList: Story = {
  render: () => (
    <div className="flex w-72 flex-col gap-4">
      {[
        { id: 'notifications', label: 'Push Notifications' },
        { id: 'sound', label: 'Sound Effects' },
        { id: 'analytics', label: 'Usage Analytics' },
      ].map(item => (
        <div key={item.id} className="flex items-center justify-between">
          <Label htmlFor={item.id}>{item.label}</Label>
          <Switch id={item.id} />
        </div>
      ))}
    </div>
  ),
};
