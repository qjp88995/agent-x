import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bot, Code, FileText, Sparkles } from 'lucide-react';

import { type SlashCommand, SlashCommandMenu } from './slash-command-menu';

const meta: Meta = {
  title: 'Chat/SlashCommandMenu',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const commands: SlashCommand[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    description: 'Summarize the current conversation',
    icon: <FileText className="size-4" />,
    group: 'Actions',
  },
  {
    id: 'code',
    label: 'Code',
    description: 'Generate code from description',
    icon: <Code className="size-4" />,
    group: 'Actions',
  },
  {
    id: 'explain',
    label: 'Explain',
    description: 'Explain a concept in detail',
    icon: <Sparkles className="size-4" />,
    group: 'Actions',
  },
  {
    id: 'agent-1',
    label: 'Code Assistant',
    description: 'Switch to Code Assistant agent',
    icon: <Bot className="size-4" />,
    group: 'Agents',
  },
  {
    id: 'agent-2',
    label: 'Doc Writer',
    description: 'Switch to Doc Writer agent',
    icon: <Bot className="size-4" />,
    group: 'Agents',
  },
];

export const Open: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    const [search, setSearch] = React.useState('');

    return (
      <div className="relative h-80">
        <div className="absolute bottom-0 left-0 w-80">
          <SlashCommandMenu
            commands={commands}
            open={open}
            onOpenChange={setOpen}
            onSelect={cmd => console.log('selected', cmd)}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </div>
    );
  },
};

export const Filtered: Story = {
  render: () => {
    const [open, setOpen] = React.useState(true);
    const [search, setSearch] = React.useState('code');

    return (
      <div className="relative h-60">
        <div className="absolute bottom-0 left-0 w-80">
          <SlashCommandMenu
            commands={commands}
            open={open}
            onOpenChange={setOpen}
            onSelect={cmd => console.log('selected', cmd)}
            search={search}
            onSearchChange={setSearch}
          />
        </div>
      </div>
    );
  },
};
