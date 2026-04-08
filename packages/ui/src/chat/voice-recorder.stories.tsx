import type { Meta, StoryObj } from '@storybook/react-vite';

import { VoiceRecorder } from './voice-recorder';

const meta: Meta<typeof VoiceRecorder> = {
  title: 'Chat/VoiceRecorder',
  component: VoiceRecorder,
  tags: ['autodocs'],
  argTypes: {
    state: {
      control: 'select',
      options: ['recording', 'transcribing'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof VoiceRecorder>;

export const Recording: Story = {
  args: {
    state: 'recording',
    duration: 15,
    onCancel: () => console.log('cancel'),
    onStop: () => console.log('stop'),
  },
};

export const RecordingLong: Story = {
  args: {
    state: 'recording',
    duration: 125,
    onCancel: () => console.log('cancel'),
    onStop: () => console.log('stop'),
  },
};

export const Transcribing: Story = {
  args: {
    state: 'transcribing',
    onCancel: () => console.log('cancel'),
    onStop: () => console.log('stop'),
  },
};
