import * as React from 'react';

import type { Meta, StoryObj } from '@storybook/react-vite';
import { Bell, Globe, Key, Lock, Palette, Server, User } from 'lucide-react';

import { SettingsNav, SettingsNavGroup, SettingsNavItem } from './settings-nav';

const meta: Meta = {
  title: 'Settings/SettingsNav',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

export const Basic: Story = {
  render: () => {
    const [value, setValue] = React.useState('profile');

    return (
      <div className="w-48">
        <SettingsNav value={value} onValueChange={setValue}>
          <SettingsNavGroup title="Account">
            <SettingsNavItem value="profile" icon={User}>
              Profile
            </SettingsNavItem>
            <SettingsNavItem value="security" icon={Lock}>
              Security
            </SettingsNavItem>
            <SettingsNavItem value="api-keys" icon={Key}>
              API Keys
            </SettingsNavItem>
          </SettingsNavGroup>
          <SettingsNavGroup title="Preferences">
            <SettingsNavItem value="appearance" icon={Palette}>
              Appearance
            </SettingsNavItem>
            <SettingsNavItem value="language" icon={Globe}>
              Language
            </SettingsNavItem>
            <SettingsNavItem value="notifications" icon={Bell} count={3}>
              Notifications
            </SettingsNavItem>
          </SettingsNavGroup>
          <SettingsNavGroup title="System">
            <SettingsNavItem value="providers" icon={Server}>
              Providers
            </SettingsNavItem>
          </SettingsNavGroup>
        </SettingsNav>
      </div>
    );
  },
};
