import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { ChevronsUpDown } from 'lucide-react';

import { Button } from './button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';

const meta: Meta = {
  title: 'Primitives/Collapsible',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const [open, setOpen] = React.useState(false);

    return (
      <Collapsible open={open} onOpenChange={setOpen} className="w-80">
        <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <span className="text-sm font-medium">Advanced Settings</span>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="icon-sm">
              <ChevronsUpDown className="size-4" />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent>
          <div className="mt-2 flex flex-col gap-2 rounded-md border border-border p-3">
            <p className="text-sm text-foreground-secondary">
              Temperature: 0.7
            </p>
            <p className="text-sm text-foreground-secondary">
              Max Tokens: 4096
            </p>
            <p className="text-sm text-foreground-secondary">
              Top P: 0.9
            </p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  },
};

export const DefaultOpen: Story = {
  render: () => (
    <Collapsible defaultOpen className="w-80">
      <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
        <span className="text-sm font-medium">Details</span>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <ChevronsUpDown className="size-4" />
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="mt-2 rounded-md border border-border p-3 text-sm text-foreground-secondary">
          This section is open by default.
        </div>
      </CollapsibleContent>
    </Collapsible>
  ),
};
