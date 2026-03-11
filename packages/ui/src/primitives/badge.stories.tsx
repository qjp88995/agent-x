import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './badge';

const meta: Meta<typeof Badge> = {
  title: 'Primitives/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'destructive', 'info', 'muted'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: 'Badge',
    variant: 'default',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="default">Default</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="destructive">Destructive</Badge>
      <Badge variant="info">Info</Badge>
      <Badge variant="muted">Muted</Badge>
    </div>
  ),
};

export const WithDot: Story = {
  render: () => (
    <div className="flex items-center gap-2 flex-wrap">
      <Badge variant="success">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        Active
      </Badge>
      <Badge variant="warning">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        Pending
      </Badge>
      <Badge variant="destructive">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        Error
      </Badge>
      <Badge variant="muted">
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
        Archived
      </Badge>
    </div>
  ),
};
