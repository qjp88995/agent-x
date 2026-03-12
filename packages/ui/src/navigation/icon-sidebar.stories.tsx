import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, FileText, Key, Plug, Settings, Sparkles, Users, Wrench, Zap } from 'lucide-react';

import { IconSidebar, type SidebarItem } from './icon-sidebar';

const mainItems: SidebarItem[] = [
  { icon: <Bot className="size-4.5" />, label: 'Agents', href: '/agents', active: true },
  { icon: <Zap className="size-4.5" />, label: 'Providers', href: '/providers' },
  { icon: <Plug className="size-4.5" />, label: 'MCP Servers', href: '/mcp-servers' },
  { icon: <Sparkles className="size-4.5" />, label: 'Skills', href: '/skills' },
  { icon: <FileText className="size-4.5" />, label: 'Prompts', href: '/prompts' },
  { icon: <Key className="size-4.5" />, label: 'API Keys', href: '/api-keys' },
  { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
];

const bottomItems: SidebarItem[] = [
  { icon: <Settings className="size-4.5" />, label: 'Settings', href: '/settings' },
  { icon: <Wrench className="size-4.5" />, label: 'System', href: '/system-config' },
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
          'A collapsible icon sidebar that expands on hover. Width transitions from 52px (collapsed) to 200px (expanded). Expand is pure CSS via group hover — no JS state required.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="relative h-150 bg-background">
        <Story />
        <div className="pl-13 p-6 text-foreground-muted text-[12px]">
          Hover the sidebar to expand it
        </div>
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof IconSidebar>;

export const Default: Story = {
  name: 'Default (hover to expand)',
  args: {
    items: mainItems,
    bottomItems,
  },
};

export const WithActiveItem: Story = {
  name: 'With Active Item',
  args: {
    items: [
      { icon: <Bot className="size-4.5" />, label: 'Agents', href: '/agents' },
      { icon: <Zap className="size-4.5" />, label: 'Providers', href: '/providers', active: true },
      { icon: <Plug className="size-4.5" />, label: 'MCP Servers', href: '/mcp-servers' },
      { icon: <Sparkles className="size-4.5" />, label: 'Skills', href: '/skills' },
      { icon: <FileText className="size-4.5" />, label: 'Prompts', href: '/prompts' },
      { icon: <Key className="size-4.5" />, label: 'API Keys', href: '/api-keys' },
      { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
    ],
    bottomItems,
  },
};

export const WithBadges: Story = {
  name: 'With Badges',
  args: {
    items: [
      { icon: <Bot className="size-4.5" />, label: 'Agents', href: '/agents', active: true, badge: 3 },
      { icon: <Zap className="size-4.5" />, label: 'Providers', href: '/providers' },
      { icon: <Plug className="size-4.5" />, label: 'MCP Servers', href: '/mcp-servers', badge: 12 },
      { icon: <Sparkles className="size-4.5" />, label: 'Skills', href: '/skills' },
      { icon: <FileText className="size-4.5" />, label: 'Prompts', href: '/prompts', badge: 'NEW' },
      { icon: <Key className="size-4.5" />, label: 'API Keys', href: '/api-keys' },
      { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
    ],
    bottomItems,
  },
};

export const WithFooter: Story = {
  name: 'With Footer (avatar area)',
  args: {
    items: mainItems,
    bottomItems,
    footer: (
      <div className="flex flex-col gap-2">
        <div className="border-t border-border" />
        <div className="flex items-center gap-2">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-card text-[10px] text-foreground-muted">
            U
          </div>
          <span className="flex-1 truncate text-[11px] font-medium text-foreground-muted opacity-0 transition-opacity duration-150 delay-50 group-hover/sidebar:opacity-100">
            User Name
          </span>
        </div>
      </div>
    ),
  },
};
