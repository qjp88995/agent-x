import type { Meta, StoryObj } from '@storybook/react-vite';
import { Plus } from 'lucide-react';
import { Button } from '../primitives/button';
import { PageHeader } from './page-header';

const meta: Meta<typeof PageHeader> = {
  title: 'Navigation/PageHeader',
  component: PageHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A 48px top bar with a page title on the left and optional search trigger + action slots on the right.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-background min-h-[200px]">
        <Story />
        <div className="p-6 text-foreground-muted text-[12px]">Page content area</div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PageHeader>;

export const Default: Story = {
  name: 'Default',
  args: {
    title: 'Agents',
  },
};

export const WithSearch: Story = {
  name: 'With Search',
  args: {
    title: 'Agents',
    search: true,
    onSearchClick: () => alert('Search clicked'),
  },
};

export const WithCreateButton: Story = {
  name: 'With Create Button',
  args: {
    title: 'Agents',
    actions: (
      <Button variant="primary" size="sm">
        <Plus />
        Create Agent
      </Button>
    ),
  },
};

export const WithSearchAndButton: Story = {
  name: 'With Search and Button',
  args: {
    title: 'Agents',
    search: true,
    onSearchClick: () => alert('Search clicked'),
    actions: (
      <Button variant="primary" size="sm">
        <Plus />
        Create Agent
      </Button>
    ),
  },
};

export const WithDescription: Story = {
  name: 'With Description',
  args: {
    title: 'Agents',
    description: 'Manage your AI agents',
    search: true,
    actions: (
      <Button variant="primary" size="sm">
        <Plus />
        Create Agent
      </Button>
    ),
  },
};
