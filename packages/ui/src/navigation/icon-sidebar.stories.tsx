import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Bot,
  FileText,
  Key,
  Plug,
  Settings,
  Sparkles,
  Users,
  Wrench,
  Zap,
} from 'lucide-react';

import { IconSidebar, type SidebarItem } from './icon-sidebar';

const mainItems: SidebarItem[] = [
  {
    icon: <Bot className="size-4.5" />,
    label: 'Agents',
    href: '/agents',
    active: true,
  },
  {
    icon: <Zap className="size-4.5" />,
    label: 'Providers',
    href: '/providers',
  },
  {
    icon: <Plug className="size-4.5" />,
    label: 'MCP Servers',
    href: '/mcp-servers',
  },
  { icon: <Sparkles className="size-4.5" />, label: 'Skills', href: '/skills' },
  {
    icon: <FileText className="size-4.5" />,
    label: 'Prompts',
    href: '/prompts',
  },
  { icon: <Key className="size-4.5" />, label: 'API Keys', href: '/api-keys' },
  { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
];

const bottomItems: SidebarItem[] = [
  {
    icon: <Settings className="size-4.5" />,
    label: 'Settings',
    href: '/settings',
  },
  {
    icon: <Wrench className="size-4.5" />,
    label: 'System',
    href: '/system-config',
  },
];

const meta: Meta<typeof IconSidebar> = {
  title: 'Navigation/IconSidebar',
  component: IconSidebar,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A collapsible icon sidebar with controlled expand/collapse state. Width transitions from 52px (collapsed) to 200px (expanded) via the `expanded` prop. When collapsed, hovering over nav items shows a label tooltip on the right side.',
      },
    },
  },
  decorators: [
    Story => (
      <div className="relative h-150 bg-background">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IconSidebar>;

export const Collapsed: Story = {
  name: 'Collapsed',
  args: {
    expanded: false,
    items: mainItems,
    bottomItems,
  },
};

export const Expanded: Story = {
  name: 'Expanded',
  args: {
    expanded: true,
    items: mainItems,
    bottomItems,
  },
};

export const WithActiveItem: Story = {
  name: 'With Active Item',
  args: {
    items: [
      { icon: <Bot className="size-4.5" />, label: 'Agents', href: '/agents' },
      {
        icon: <Zap className="size-4.5" />,
        label: 'Providers',
        href: '/providers',
        active: true,
      },
      {
        icon: <Plug className="size-4.5" />,
        label: 'MCP Servers',
        href: '/mcp-servers',
      },
      {
        icon: <Sparkles className="size-4.5" />,
        label: 'Skills',
        href: '/skills',
      },
      {
        icon: <FileText className="size-4.5" />,
        label: 'Prompts',
        href: '/prompts',
      },
      {
        icon: <Key className="size-4.5" />,
        label: 'API Keys',
        href: '/api-keys',
      },
      { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
    ],
    bottomItems,
  },
};

export const WithBadges: Story = {
  name: 'With Badges',
  args: {
    items: [
      {
        icon: <Bot className="size-4.5" />,
        label: 'Agents',
        href: '/agents',
        active: true,
        badge: 3,
      },
      {
        icon: <Zap className="size-4.5" />,
        label: 'Providers',
        href: '/providers',
      },
      {
        icon: <Plug className="size-4.5" />,
        label: 'MCP Servers',
        href: '/mcp-servers',
        badge: 12,
      },
      {
        icon: <Sparkles className="size-4.5" />,
        label: 'Skills',
        href: '/skills',
      },
      {
        icon: <FileText className="size-4.5" />,
        label: 'Prompts',
        href: '/prompts',
        badge: 'NEW',
      },
      {
        icon: <Key className="size-4.5" />,
        label: 'API Keys',
        href: '/api-keys',
      },
      { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
    ],
    bottomItems,
  },
};
