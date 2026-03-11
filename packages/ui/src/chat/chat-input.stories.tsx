import type { Meta, StoryObj } from '@storybook/react-vite';
import { FileText, Zap, Settings } from 'lucide-react';
import { ChatInput } from './chat-input';

const meta: Meta<typeof ChatInput> = {
  title: 'Chat/ChatInput',
  component: ChatInput,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
  },
  decorators: [
    Story => (
      <div className="max-w-2xl mx-auto">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ChatInput>;

const sampleCommands = [
  {
    id: 'summarize',
    label: '/summarize',
    description: 'Summarize the conversation',
    icon: <FileText className="size-3.5" />,
    group: 'Actions',
  },
  {
    id: 'quick-reply',
    label: '/quick',
    description: 'Generate a quick reply',
    icon: <Zap className="size-3.5" />,
    group: 'Actions',
  },
  {
    id: 'settings',
    label: '/settings',
    description: 'Open agent settings',
    icon: <Settings className="size-3.5" />,
    group: 'Navigation',
  },
];

const sampleFiles = [
  { id: '1', name: 'report.pdf', size: '2.4 MB', type: 'file' as const },
  {
    id: '2',
    name: 'screenshot.png',
    size: '512 KB',
    type: 'image' as const,
    thumbnail: 'https://placehold.co/32x32/10b981/ffffff?text=img',
  },
];

export const Empty: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    placeholder: 'Type a message...',
  },
};

export const WithContent: Story = {
  args: {
    value: 'Hello, can you help me with a code review?',
    onChange: () => {},
    onSubmit: () => {},
  },
};

export const WithFiles: Story = {
  args: {
    value: 'Here are the files I mentioned.',
    onChange: () => {},
    onSubmit: () => {},
    files: sampleFiles,
    onFileRemove: () => {},
  },
};

export const SlashCommandOpen: Story = {
  args: {
    value: '/sum',
    onChange: () => {},
    onSubmit: () => {},
    commands: sampleCommands,
    slashMenuOpen: true,
    slashSearch: 'sum',
    onSlashMenuOpenChange: () => {},
    onSlashSelect: () => {},
    onSlashSearchChange: () => {},
  },
};

export const VoiceRecording: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    voiceState: 'recording',
    voiceDuration: 12,
    onVoiceStop: () => {},
    onVoiceCancel: () => {},
  },
};

export const VoiceTranscribing: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    voiceState: 'transcribing',
    onVoiceStop: () => {},
    onVoiceCancel: () => {},
  },
};

export const Streaming: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    streaming: true,
    onStop: () => {},
    placeholder: 'Waiting for response...',
  },
};

export const DragOver: Story = {
  args: {
    value: '',
    onChange: () => {},
    onSubmit: () => {},
    dragOver: true,
  },
};
