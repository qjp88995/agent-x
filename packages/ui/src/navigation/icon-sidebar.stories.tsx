import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, FileText, Key, Plug, Settings, Sparkles, Users,Zap } from 'lucide-react';

import { IconSidebar, type SidebarItem } from './icon-sidebar';

const defaultItems: SidebarItem[] = [
  { icon: <Bot className="size-4.5" />, label: 'Agents', href: '/agents', active: true },
  { icon: <Zap className="size-4.5" />, label: 'Providers', href: '/providers' },
  { icon: <Plug className="size-4.5" />, label: 'MCP Servers', href: '/mcp-servers' },
  { icon: <Sparkles className="size-4.5" />, label: 'Skills', href: '/skills' },
  { icon: <FileText className="size-4.5" />, label: 'Prompts', href: '/prompts' },
  { icon: <Key className="size-4.5" />, label: 'API Keys', href: '/api-keys' },
  { icon: <Users className="size-4.5" />, label: 'Users', href: '/users' },
  { icon: <Settings className="size-4.5" />, label: 'Settings', href: '/settings' },
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

export const Collapsed: Story = {
  name: 'Collapsed (hover to expand)',
  args: {
    items: defaultItems,
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
      { icon: <Settings className="size-4.5" />, label: 'Settings', href: '/settings' },
    ],
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
      { icon: <Settings className="size-4.5" />, label: 'Settings', href: '/settings' },
    ],
  },
};
