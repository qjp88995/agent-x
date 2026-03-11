import * as React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Edit, Trash } from 'lucide-react';
import { DataTable, type Column } from './data-table';
import { Badge } from '../primitives/badge';
import { Avatar } from '../primitives/avatar';
import { Button } from '../primitives/button';

type Agent = {
  id: string;
  name: string;
  color: string;
  model: string;
  status: 'active' | 'archived';
  lastActive: string;
};

const agents: Agent[] = [
  {
    id: '1',
    name: 'Code Assistant',
    color: '#10b981',
    model: 'claude-3.5-sonnet',
    status: 'active',
    lastActive: '2 min ago',
  },
  {
    id: '2',
    name: 'Doc Writer',
    color: '#3b82f6',
    model: 'gpt-4o',
    status: 'active',
    lastActive: '1 hour ago',
  },
  {
    id: '3',
    name: 'Test Runner',
    color: '#8b5cf6',
    model: 'claude-3-haiku',
    status: 'archived',
    lastActive: '3 days ago',
  },
  {
    id: '4',
    name: 'Data Analyst',
    color: '#f59e0b',
    model: 'gpt-4o-mini',
    status: 'active',
    lastActive: '10 min ago',
  },
  {
    id: '5',
    name: 'Support Bot',
    color: '#ef4444',
    model: 'claude-3-sonnet',
    status: 'archived',
    lastActive: '2 weeks ago',
  },
];

const agentColumns: Column<Agent>[] = [
  {
    key: 'name',
    header: 'Name',
    render: agent => (
      <span className="flex items-center gap-2">
        <Avatar name={agent.name} size="sm" />
        <span className="font-medium text-[var(--foreground)]">
          {agent.name}
        </span>
      </span>
    ),
    sortable: true,
  },
  {
    key: 'model',
    header: 'Model',
    render: agent => agent.model,
    sortable: true,
  },
  {
    key: 'status',
    header: 'Status',
    width: '120px',
    render: agent => (
      <Badge variant={agent.status === 'active' ? 'success' : 'muted'}>
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        {agent.status === 'active' ? 'Active' : 'Archived'}
      </Badge>
    ),
  },
  {
    key: 'lastActive',
    header: 'Last Active',
    width: '140px',
    render: agent => agent.lastActive,
  },
];

const meta: Meta = {
  title: 'Data/DataTable',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const AgentTable: Story = {
  render: () => {
    const [sortKey, setSortKey] = React.useState<string | undefined>();
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(
      'asc'
    );

    const handleSort = (key: string) => {
      if (sortKey === key) {
        setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDirection('asc');
      }
    };

    const sortedAgents = [...agents].sort((a, b) => {
      if (!sortKey) return 0;
      const aVal = a[sortKey as keyof Agent];
      const bVal = b[sortKey as keyof Agent];
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDirection === 'asc' ? cmp : -cmp;
    });

    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
        <DataTable
          columns={agentColumns}
          data={sortedAgents}
          keyExtractor={a => a.id}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={handleSort}
          onRowClick={a => console.log('clicked', a.name)}
          rowActions={_a => (
            <span className="flex items-center justify-end gap-1">
              <Button variant="ghost" size="icon-sm">
                <Edit className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-sm">
                <Trash className="h-3.5 w-3.5" />
              </Button>
            </span>
          )}
        />
      </div>
    );
  },
};

export const EmptyState: Story = {
  render: () => (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <DataTable
        columns={agentColumns}
        data={[]}
        keyExtractor={a => a.id}
        emptyState={
          <span className="flex flex-col items-center gap-1">
            <span className="text-[var(--foreground-muted)]">
              No agents found
            </span>
            <span className="text-[10px] text-[var(--foreground-ghost)]">
              Create your first agent to get started
            </span>
          </span>
        }
      />
    </div>
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface)]">
      <DataTable
        columns={agentColumns}
        data={[]}
        keyExtractor={a => a.id}
        loading={true}
        loadingRows={5}
      />
    </div>
  ),
};
