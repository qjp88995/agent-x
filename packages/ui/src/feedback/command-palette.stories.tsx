import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BotIcon,
  LayoutDashboardIcon,
  ListIcon,
  MoonIcon,
  PaletteIcon,
  SettingsIcon,
  WrenchIcon,
  ZapIcon,
} from 'lucide-react';

import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteItemIcon,
  CommandPaletteList,
  CommandPaletteSeparator,
  Kbd,
} from './command-palette';

// ── Shared sample content ────────────────────────────────────────────────────

function SampleContent() {
  return (
    <>
      <CommandPaletteInput placeholder="Search commands…" />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
        <CommandPaletteGroup heading="Agents">
          <CommandPaletteItem value="create-agent">
            <CommandPaletteItemIcon>
              <BotIcon size={14} />
            </CommandPaletteItemIcon>
            Create Agent
          </CommandPaletteItem>
          <CommandPaletteItem value="view-all-agents">
            <CommandPaletteItemIcon>
              <ListIcon size={14} />
            </CommandPaletteItemIcon>
            View All Agents
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup heading="Actions">
          <CommandPaletteItem value="toggle-theme">
            <CommandPaletteItemIcon>
              <MoonIcon size={14} />
            </CommandPaletteItemIcon>
            Toggle Theme
          </CommandPaletteItem>
          <CommandPaletteItem value="open-settings">
            <CommandPaletteItemIcon>
              <SettingsIcon size={14} />
            </CommandPaletteItemIcon>
            Open Settings
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup heading="Pages">
          <CommandPaletteItem value="providers">
            <CommandPaletteItemIcon>
              <WrenchIcon size={14} />
            </CommandPaletteItemIcon>
            Providers
          </CommandPaletteItem>
          <CommandPaletteItem value="skills">
            <CommandPaletteItemIcon>
              <ZapIcon size={14} />
            </CommandPaletteItemIcon>
            Skills
          </CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </>
  );
}

// ── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<typeof CommandPalette> = {
  title: 'Feedback/CommandPalette',
  component: CommandPalette,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A ⌘K command palette built on cmdk. Triggered by Ctrl+K / ⌘K. Supports keyboard navigation, grouped results, and empty states.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof CommandPalette>;

// ── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => (
    <CommandPalette open onOpenChange={() => {}}>
      <SampleContent />
    </CommandPalette>
  ),
};

export const Empty: Story = {
  render: () => (
    <CommandPalette open onOpenChange={() => {}}>
      <CommandPaletteInput placeholder="Search commands…" defaultValue="xyznotfound" />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
        <CommandPaletteGroup heading="Agents">
          <CommandPaletteItem value="create-agent">Create Agent</CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </CommandPalette>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <CommandPalette open onOpenChange={() => {}}>
      <CommandPaletteInput placeholder="Search commands…" />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>
        <CommandPaletteGroup heading="Agents">
          <CommandPaletteItem value="create-agent">
            <CommandPaletteItemIcon>
              <BotIcon size={14} />
            </CommandPaletteItemIcon>
            Create Agent
            <Kbd>⌘N</Kbd>
          </CommandPaletteItem>
          <CommandPaletteItem value="view-all-agents">
            <CommandPaletteItemIcon>
              <ListIcon size={14} />
            </CommandPaletteItemIcon>
            View All Agents
            <Kbd>⌘A</Kbd>
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup heading="Actions">
          <CommandPaletteItem value="toggle-theme">
            <CommandPaletteItemIcon>
              <MoonIcon size={14} />
            </CommandPaletteItemIcon>
            Toggle Theme
            <Kbd>⌘T</Kbd>
          </CommandPaletteItem>
          <CommandPaletteItem value="open-settings">
            <CommandPaletteItemIcon>
              <SettingsIcon size={14} />
            </CommandPaletteItemIcon>
            Open Settings
            <Kbd>⌘,</Kbd>
          </CommandPaletteItem>
        </CommandPaletteGroup>
        <CommandPaletteSeparator />
        <CommandPaletteGroup heading="Pages">
          <CommandPaletteItem value="providers">
            <CommandPaletteItemIcon>
              <WrenchIcon size={14} />
            </CommandPaletteItemIcon>
            Providers
            <Kbd>G P</Kbd>
          </CommandPaletteItem>
          <CommandPaletteItem value="skills">
            <CommandPaletteItemIcon>
              <ZapIcon size={14} />
            </CommandPaletteItemIcon>
            Skills
            <Kbd>G S</Kbd>
          </CommandPaletteItem>
          <CommandPaletteItem value="dashboard">
            <CommandPaletteItemIcon>
              <LayoutDashboardIcon size={14} />
            </CommandPaletteItemIcon>
            Dashboard
            <Kbd>G D</Kbd>
          </CommandPaletteItem>
          <CommandPaletteItem value="system-config">
            <CommandPaletteItemIcon>
              <PaletteIcon size={14} />
            </CommandPaletteItemIcon>
            System Config
            <Kbd>G C</Kbd>
          </CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </CommandPalette>
  ),
};
