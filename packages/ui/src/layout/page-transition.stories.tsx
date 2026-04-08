import type { Meta, StoryObj } from '@storybook/react-vite';

import { PageTransition } from './page-transition';

const meta: Meta = {
  title: 'Layout/PageTransition',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <PageTransition>
      <div className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold">Page Content</h2>
        <p className="mt-2 text-sm text-foreground-secondary">
          This content animates in with a page transition effect.
        </p>
      </div>
    </PageTransition>
  ),
};
