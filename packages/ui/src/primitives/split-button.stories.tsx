import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus, Server, Tag } from 'lucide-react';

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../feedback/dropdown-menu';

import { Button } from './button';
import { SplitButton } from './split-button';

const meta: Meta<typeof SplitButton> = {
  title: 'Primitives/SplitButton',
  component: SplitButton,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof SplitButton>;

export const Default: Story = {
  render: () => (
    <SplitButton
      menuContent={
        <>
          <DropdownMenuItem>
            <Server className="mr-2 size-4" />
            Option A
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Tag className="mr-2 size-4" />
            Option B
          </DropdownMenuItem>
        </>
      }
    >
      <Plus />
      Create
    </SplitButton>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <SplitButton
        variant="primary"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        Primary
      </SplitButton>
      <SplitButton
        variant="default"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        Default
      </SplitButton>
      <SplitButton
        variant="destructive"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        Destructive
      </SplitButton>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <SplitButton
        size="sm"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        <Plus />
        Small
      </SplitButton>
      <SplitButton
        size="default"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        <Plus />
        Default
      </SplitButton>
      <SplitButton
        size="lg"
        menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
      >
        <Plus />
        Large
      </SplitButton>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <SplitButton
      disabled
      menuContent={<DropdownMenuItem>Action</DropdownMenuItem>}
    >
      Disabled
    </SplitButton>
  ),
};

export const ComparisonWithButton: Story = {
  name: 'Comparison: SplitButton vs Button',
  render: () => (
    <div className="flex items-center gap-4">
      <Button variant="primary">
        <Plus />
        Normal Button
      </Button>
      <SplitButton
        menuContent={
          <>
            <DropdownMenuItem>Create My Service</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Create System Service</DropdownMenuItem>
          </>
        }
      >
        <Plus />
        Split Button
      </SplitButton>
    </div>
  ),
};
