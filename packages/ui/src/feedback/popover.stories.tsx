import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Button } from '../primitives/button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const meta: Meta = {
  title: 'Feedback/Popover',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open Popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <p className="text-sm text-foreground-secondary">
          This is the popover content. Place any content here.
        </p>
      </PopoverContent>
    </Popover>
  ),
};

export const WithForm: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Set Dimensions</Button>
      </PopoverTrigger>
      <PopoverContent className="w-64">
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-medium">Dimensions</h4>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="width">Width</Label>
            <Input id="width" defaultValue="100%" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="height">Height</Label>
            <Input id="height" defaultValue="auto" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
