import { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';

import { Badge } from '../primitives/badge';
import { Button } from '../primitives/button';
import { Input } from '../primitives/input';
import { Label } from '../primitives/label';
import { Switch } from '../primitives/switch';
import {
  SettingsAccordion,
  SettingsAccordionContent,
  SettingsAccordionItem,
  SettingsAccordionTrigger,
} from './settings-accordion';

const meta: Meta = {
  title: 'Settings/SettingsAccordion',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-150">
        <SettingsAccordion value={value} onValueChange={setValue}>
          <SettingsAccordionItem value="profile">
            <SettingsAccordionTrigger
              title="Profile"
              description="Manage your public profile information"
              summary={<span className="text-xs text-foreground-muted">John Doe</span>}
            />
            <SettingsAccordionContent>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="display-name">Display Name</Label>
                  <Input id="display-name" defaultValue="John Doe" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="bio">Bio</Label>
                  <Input id="bio" placeholder="Tell us about yourself" />
                </div>
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="security">
            <SettingsAccordionTrigger
              title="Security"
              description="Configure security and authentication"
              summary={
                <Badge variant="success">Enabled</Badge>
              }
            />
            <SettingsAccordionContent>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <Label>Two-factor authentication</Label>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Session timeout</Label>
                  <Switch />
                </div>
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="language">
            <SettingsAccordionTrigger
              title="Language & Region"
              description="Set your preferred language and region"
              summary={<span className="text-xs text-foreground-muted">English (US)</span>}
            />
            <SettingsAccordionContent>
              <div className="p-4 text-sm text-foreground-secondary">
                Language settings content here.
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>
        </SettingsAccordion>
      </div>
    );
  },
};

export const WithTrailing: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-150">
        <SettingsAccordion value={value} onValueChange={setValue}>
          <SettingsAccordionItem value="openai">
            <SettingsAccordionTrigger
              title="OpenAI"
              description="GPT-4o, GPT-4o-mini"
              trailing={
                <Button variant="outline" size="sm">
                  Test
                </Button>
              }
            />
            <SettingsAccordionContent>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <Label>API Key</Label>
                  <Input type="password" defaultValue="sk-..." />
                </div>
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="anthropic">
            <SettingsAccordionTrigger
              title="Anthropic"
              description="Claude 3.5 Sonnet, Claude 3 Haiku"
              trailing={
                <Button variant="outline" size="sm">
                  Test
                </Button>
              }
            />
            <SettingsAccordionContent>
              <div className="flex flex-col gap-3 p-4">
                <div className="flex flex-col gap-1.5">
                  <Label>API Key</Label>
                  <Input type="password" defaultValue="sk-ant-..." />
                </div>
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>
        </SettingsAccordion>
      </div>
    );
  },
};

export const Disabled: Story = {
  render: () => {
    const [value, setValue] = useState('');
    return (
      <div className="w-150">
        <SettingsAccordion value={value} onValueChange={setValue}>
          <SettingsAccordionItem value="active">
            <SettingsAccordionTrigger
              title="Active Section"
              description="This section can be opened"
            />
            <SettingsAccordionContent>
              <div className="p-4 text-sm text-foreground-secondary">
                Content here.
              </div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>

          <SettingsAccordionItem value="disabled" disabled>
            <SettingsAccordionTrigger
              title="Disabled Section"
              description="This section cannot be opened"
            />
            <SettingsAccordionContent>
              <div className="p-4">Unreachable content.</div>
            </SettingsAccordionContent>
          </SettingsAccordionItem>
        </SettingsAccordion>
      </div>
    );
  },
};
