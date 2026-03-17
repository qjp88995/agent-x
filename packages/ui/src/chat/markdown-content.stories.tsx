import type { Meta, StoryObj } from '@storybook/react-vite';

import { MarkdownContent } from './markdown-content';

const meta: Meta<typeof MarkdownContent> = {
  title: 'Chat/MarkdownContent',
  component: MarkdownContent,
  tags: ['autodocs'],
  decorators: [
    Story => (
      <div className="max-w-2xl mx-auto p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MarkdownContent>;

export const Default: Story = {
  args: {
    content:
      'Hello! This is a **markdown** message with _italic_ text and a [link](https://example.com).',
  },
};

export const RichContent: Story = {
  args: {
    content: `# Heading 1

## Heading 2

### Heading 3

Here is a paragraph with **bold**, _italic_, and \`inline code\`.

> This is a blockquote with some important information.

### Lists

- Item one
- Item two
  - Nested item
- Item three

1. First step
2. Second step
3. Third step

### Table

| Name    | Type   | Required |
|---------|--------|----------|
| content | string | Yes      |
| className | string | No     |

---

A horizontal rule above.
`,
  },
};

export const CodeBlock: Story = {
  args: {
    content: `Here is some TypeScript code:

\`\`\`typescript
interface User {
  id: string;
  name: string;
  email: string;
}

function greet(user: User): string {
  return \`Hello, \${user.name}!\`;
}
\`\`\`

And a bash snippet:

\`\`\`bash
pnpm install
pnpm dev
\`\`\`
`,
  },
};
