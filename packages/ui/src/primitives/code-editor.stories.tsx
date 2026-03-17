import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { CodeEditor } from './code-editor';

const meta: Meta<typeof CodeEditor> = {
  title: 'Primitives/CodeEditor',
  component: CodeEditor,
  tags: ['autodocs'],
  argTypes: {
    disabled: { control: 'boolean' },
    placeholder: { control: 'text' },
  },
  decorators: [
    Story => (
      <div className="h-80">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

const sampleMarkdown = `# Agent System Prompt

You are a helpful AI assistant.

## Guidelines

- Be concise and accurate
- Use **markdown** for formatting
- Provide code examples when helpful

\`\`\`python
def greet(name: str) -> str:
    return f"Hello, {name}!"
\`\`\`
`;

export const Default: Story = {
  args: {
    placeholder: 'Write your prompt here...',
  },
};

export const WithContent: Story = {
  args: {
    value: sampleMarkdown,
  },
};

export const Disabled: Story = {
  args: {
    value: sampleMarkdown,
    disabled: true,
  },
};

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('Start typing...\n');
    return <CodeEditor value={value} onChange={setValue} />;
  },
};
