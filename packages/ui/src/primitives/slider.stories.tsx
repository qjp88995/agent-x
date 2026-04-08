import type { Meta, StoryObj } from '@storybook/react-vite';

import { Label } from './label';
import { Slider } from './slider';

const meta: Meta<typeof Slider> = {
  title: 'Primitives/Slider',
  component: Slider,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50],
    max: 100,
    step: 1,
    className: 'w-60',
  },
};

export const WithLabel: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-2">
      <Label>Temperature</Label>
      <Slider defaultValue={[70]} max={200} step={1} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="flex w-60 flex-col gap-2">
      <Label>Price Range</Label>
      <Slider defaultValue={[25, 75]} max={100} step={5} />
    </div>
  ),
};

export const Disabled: Story = {
  args: {
    defaultValue: [40],
    max: 100,
    disabled: true,
    className: 'w-60',
  },
};
