import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from './context-menu';

const Trigger = () => (
  <div className="flex h-32 w-64 items-center justify-center rounded border border-dashed text-sm text-foreground-muted select-none">
    Right-click here
  </div>
);

const meta: Meta = {
  title: 'Primitives/ContextMenu',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Trigger />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>Profile</ContextMenuItem>
        <ContextMenuItem>Settings</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem>Sign out</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithShortcuts: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Trigger />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>
          Cut <ContextMenuShortcut>⌘X</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckboxItems: Story = {
  render: function Render() {
    const [showBookmarks, setShowBookmarks] = React.useState(true);
    const [showHistory, setShowHistory] = React.useState(false);
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <Trigger />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuCheckboxItem
            checked={showBookmarks}
            onCheckedChange={setShowBookmarks}
          >
            Show Bookmarks
          </ContextMenuCheckboxItem>
          <ContextMenuCheckboxItem
            checked={showHistory}
            onCheckedChange={setShowHistory}
          >
            Show History
          </ContextMenuCheckboxItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

export const WithRadioGroup: Story = {
  render: function Render() {
    const [view, setView] = React.useState('list');
    return (
      <ContextMenu>
        <ContextMenuTrigger>
          <Trigger />
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuLabel>View Mode</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuRadioGroup value={view} onValueChange={setView}>
            <ContextMenuRadioItem value="list">List</ContextMenuRadioItem>
            <ContextMenuRadioItem value="grid">Grid</ContextMenuRadioItem>
            <ContextMenuRadioItem value="tree">Tree</ContextMenuRadioItem>
          </ContextMenuRadioGroup>
        </ContextMenuContent>
      </ContextMenu>
    );
  },
};

export const WithSubMenu: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Trigger />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>New File</ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>New From Template</ContextMenuSubTrigger>
          <ContextMenuSubContent className="w-48">
            <ContextMenuItem>React Component</ContextMenuItem>
            <ContextMenuItem>TypeScript Module</ContextMenuItem>
            <ContextMenuItem>Test File</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem>Open in Terminal</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithDestructiveItem: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger>
        <Trigger />
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem>Rename</ContextMenuItem>
        <ContextMenuItem>Duplicate</ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
