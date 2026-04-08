import type { Meta, StoryObj } from '@storybook/react-vite';
import { Globe, Lock, Palette, User } from 'lucide-react';

import { SettingsLayout } from './settings-layout';
import { SettingsNav, SettingsNavGroup, SettingsNavItem } from './settings-nav';

const meta: Meta = {
  title: 'Settings/SettingsLayout',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => (
    <div className="h-96 w-[800px] rounded-lg border border-border">
      <SettingsLayout
        sidebar={
          <SettingsNav value="profile" onValueChange={() => {}}>
            <SettingsNavGroup title="Account">
              <SettingsNavItem value="profile" icon={User}>
                Profile
              </SettingsNavItem>
              <SettingsNavItem value="security" icon={Lock}>
                Security
              </SettingsNavItem>
            </SettingsNavGroup>
            <SettingsNavGroup title="Preferences">
              <SettingsNavItem value="appearance" icon={Palette}>
                Appearance
              </SettingsNavItem>
              <SettingsNavItem value="language" icon={Globe}>
                Language
              </SettingsNavItem>
            </SettingsNavGroup>
          </SettingsNav>
        }
      >
        <div>
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-2 text-sm text-foreground-secondary">
            Manage your public profile information.
          </p>
        </div>
      </SettingsLayout>
    </div>
  ),
};
