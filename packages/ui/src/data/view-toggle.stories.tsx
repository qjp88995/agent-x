import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { type ViewMode,ViewToggle } from './view-toggle';

const meta: Meta<typeof ViewToggle> = {
  title: 'Data/ViewToggle',
  component: ViewToggle,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ViewToggle>;

export const Default: Story = {
  render: () => {
    const [view, setView] = useState<ViewMode>('table');
    return <ViewToggle value={view} onChange={setView} />;
  },
};

export const TableActive: Story = {
  args: {
    value: 'table',
    onChange: () => {},
  },
};

export const GridActive: Story = {
  args: {
    value: 'grid',
    onChange: () => {},
  },
};
