import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import { FilterTabs } from './filter-tabs';

const meta: Meta<typeof FilterTabs> = {
  title: 'Data/FilterTabs',
  component: FilterTabs,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof FilterTabs>;

const defaultTabs = [
  { key: 'all', label: 'All', count: 12 },
  { key: 'active', label: 'Active', count: 8 },
  { key: 'archived', label: 'Archived', count: 4 },
];

export const Default: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    return <FilterTabs tabs={defaultTabs} value={active} onChange={setActive} />;
  },
};

export const WithoutCounts: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    const tabs = [
      { key: 'all', label: 'All' },
      { key: 'active', label: 'Active' },
      { key: 'archived', label: 'Archived' },
    ];
    return <FilterTabs tabs={tabs} value={active} onChange={setActive} />;
  },
};

export const ManyTabs: Story = {
  render: () => {
    const [active, setActive] = useState('all');
    const tabs = [
      { key: 'all', label: 'All', count: 42 },
      { key: 'draft', label: 'Draft', count: 5 },
      { key: 'active', label: 'Active', count: 20 },
      { key: 'paused', label: 'Paused', count: 7 },
      { key: 'archived', label: 'Archived', count: 10 },
    ];
    return <FilterTabs tabs={tabs} value={active} onChange={setActive} />;
  },
};
