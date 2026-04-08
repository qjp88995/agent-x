import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../primitives/badge';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './table';

const meta: Meta = {
  title: 'Data/Table',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

const providers = [
  { name: 'OpenAI', protocol: 'openai', models: 12, status: 'active' },
  { name: 'Anthropic', protocol: 'anthropic', models: 5, status: 'active' },
  { name: 'Google', protocol: 'gemini', models: 8, status: 'active' },
  { name: 'DeepSeek', protocol: 'deepseek', models: 3, status: 'inactive' },
];

export const Basic: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead className="text-right">Models</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map(p => (
          <TableRow key={p.name}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell>{p.protocol}</TableCell>
            <TableCell className="text-right">{p.models}</TableCell>
            <TableCell>
              <Badge variant={p.status === 'active' ? 'success' : 'muted'}>
                {p.status}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const WithCaption: Story = {
  render: () => (
    <Table>
      <TableCaption>A list of configured model providers.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead className="text-right">Models</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {providers.map(p => (
          <TableRow key={p.name}>
            <TableCell className="font-medium">{p.name}</TableCell>
            <TableCell>{p.protocol}</TableCell>
            <TableCell className="text-right">{p.models}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};

export const Empty: Story = {
  render: () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Provider</TableHead>
          <TableHead>Protocol</TableHead>
          <TableHead>Models</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className="text-center text-foreground-muted">
            No providers configured.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  ),
};
