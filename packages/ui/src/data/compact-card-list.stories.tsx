import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, Edit, MoreHorizontal, Trash } from 'lucide-react';

import { Badge } from '../primitives/badge';
import { Button } from '../primitives/button';
import { CompactCardItem, CompactCardList } from './compact-card-list';

const meta: Meta = {
  title: 'Data/CompactCardList',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <CompactCardList className="w-96">
      <CompactCardItem
        icon={<Bot className="size-4" />}
        title="Code Assistant"
        subtitle="claude-3.5-sonnet"
      />
      <CompactCardItem
        icon={<Bot className="size-4" />}
        title="Doc Writer"
        subtitle="gpt-4o"
      />
      <CompactCardItem
        icon={<Bot className="size-4" />}
        title="Test Runner"
        subtitle="claude-3-haiku"
      />
    </CompactCardList>
  ),
};

export const WithBadgesAndActions: Story = {
  render: () => (
    <CompactCardList className="w-96">
      <CompactCardItem
        icon={<Bot className="size-4" />}
        title="Code Assistant"
        subtitle="claude-3.5-sonnet"
        badges={<Badge variant="success">Active</Badge>}
        actions={
          <span className="flex gap-1">
            <Button variant="ghost" size="icon-sm">
              <Edit className="size-3.5" />
            </Button>
            <Button variant="ghost" size="icon-sm">
              <Trash className="size-3.5" />
            </Button>
          </span>
        }
      />
      <CompactCardItem
        icon={<Bot className="size-4" />}
        title="Doc Writer"
        subtitle="gpt-4o"
        badges={<Badge variant="muted">Archived</Badge>}
        actions={
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-3.5" />
          </Button>
        }
      />
    </CompactCardList>
  ),
};

export const Clickable: Story = {
  render: () => (
    <CompactCardList className="w-96">
      {['Code Assistant', 'Doc Writer', 'Test Runner'].map(name => (
        <CompactCardItem
          key={name}
          icon={<Bot className="size-4" />}
          title={name}
          subtitle="Click to edit"
          onClick={() => console.log('clicked', name)}
        />
      ))}
    </CompactCardList>
  ),
};
