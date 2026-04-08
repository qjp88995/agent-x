import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './resizable';

const meta: Meta = {
  title: 'Primitives/Resizable',
  tags: ['autodocs'],
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <div className="h-[400px] p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

const Panel = ({ label }: { label: string }) => (
  <div className="flex h-full items-center justify-center rounded bg-card text-sm text-foreground-muted">
    {label}
  </div>
);

export const Horizontal: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="rounded border">
      <ResizablePanel defaultSize="50%">
        <Panel label="Left Panel" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="50%">
        <Panel label="Right Panel" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ResizablePanelGroup orientation="vertical" className="rounded border">
      <ResizablePanel defaultSize="50%">
        <Panel label="Top Panel" />
      </ResizablePanel>
      <ResizableHandle />
      <ResizablePanel defaultSize="50%">
        <Panel label="Bottom Panel" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const WithHandle: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="rounded border">
      <ResizablePanel defaultSize="50%">
        <Panel label="Left Panel" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <Panel label="Right Panel" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};

export const ThreePanels: Story = {
  render: () => (
    <ResizablePanelGroup orientation="horizontal" className="rounded border">
      <ResizablePanel defaultSize="25%">
        <Panel label="Sidebar" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="50%">
        <Panel label="Editor" />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize="25%">
        <Panel label="Preview" />
      </ResizablePanel>
    </ResizablePanelGroup>
  ),
};
