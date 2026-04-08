import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Settings, Trash } from 'lucide-react';

import { Button } from '../primitives/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './tooltip';

const meta: Meta = {
  title: 'Feedback/Tooltip',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="outline">Hover me</Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>This is a tooltip</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  ),
};

export const Positions: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-4 py-10">
        {(['top', 'right', 'bottom', 'left'] as const).map(side => (
          <Tooltip key={side}>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm">
                {side}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              <p>Tooltip on {side}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  ),
};

export const IconButtons: Story = {
  render: () => (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Plus />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Add new</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Settings</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Trash />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Delete</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
};
