import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './checkbox';
import { Label } from './label';

const meta: Meta<typeof Checkbox> = {
  title: 'Primitives/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
  args: {},
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" />
      <Label htmlFor="terms">Accept terms and conditions</Label>
    </div>
  ),
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-unchecked" disabled />
        <Label htmlFor="disabled-unchecked">Disabled unchecked</Label>
      </div>
      <div className="flex items-center gap-2">
        <Checkbox id="disabled-checked" disabled defaultChecked />
        <Label htmlFor="disabled-checked">Disabled checked</Label>
      </div>
    </div>
  ),
};

export const Group: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      {['Email notifications', 'Push notifications', 'SMS notifications'].map(
        label => (
          <div key={label} className="flex items-center gap-2">
            <Checkbox id={label} />
            <Label htmlFor={label}>{label}</Label>
          </div>
        )
      )}
    </div>
  ),
};
