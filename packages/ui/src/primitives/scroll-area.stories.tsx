import type { Meta, StoryObj } from '@storybook/react-vite';

import { ScrollArea, ScrollBar } from './scroll-area';
import { Separator } from './separator';

const meta: Meta = {
  title: 'Primitives/ScrollArea',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const items = Array.from({ length: 30 }, (_, i) => `Item ${i + 1}`);

export const Vertical: Story = {
  render: () => (
    <ScrollArea className="h-60 w-48 rounded-md border border-border">
      <div className="p-3">
        <h4 className="mb-3 text-sm font-medium">Items</h4>
        {items.map(item => (
          <div key={item}>
            <div className="py-1.5 text-sm text-foreground-secondary">
              {item}
            </div>
            <Separator />
          </div>
        ))}
      </div>
    </ScrollArea>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <ScrollArea className="w-80 whitespace-nowrap rounded-md border border-border">
      <div className="flex gap-3 p-3">
        {Array.from({ length: 15 }, (_, i) => (
          <div
            key={i}
            className="flex h-20 w-32 shrink-0 items-center justify-center rounded-md bg-surface text-sm text-foreground-secondary"
          >
            Card {i + 1}
          </div>
        ))}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  ),
};
