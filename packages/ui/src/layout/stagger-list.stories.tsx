import type { Meta, StoryObj } from '@storybook/react-vite';

import { StaggerItem, StaggerList } from './stagger-list';

const meta: Meta = {
  title: 'Layout/StaggerList',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <StaggerList className="flex flex-col gap-3 w-80">
      {['First item', 'Second item', 'Third item', 'Fourth item'].map(
        text => (
          <StaggerItem key={text}>
            <div className="rounded-lg border border-border p-3 text-sm">
              {text}
            </div>
          </StaggerItem>
        )
      )}
    </StaggerList>
  ),
};

export const Cards: Story = {
  render: () => (
    <StaggerList className="grid grid-cols-3 gap-4">
      {Array.from({ length: 6 }, (_, i) => (
        <StaggerItem key={i}>
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-medium">Card {i + 1}</h3>
            <p className="mt-1 text-xs text-foreground-secondary">
              Staggered animation
            </p>
          </div>
        </StaggerItem>
      ))}
    </StaggerList>
  ),
};
