import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  CommandPalette,
  CommandPaletteEmpty,
  CommandPaletteGroup,
  CommandPaletteInput,
  CommandPaletteItem,
  CommandPaletteItemIcon,
  CommandPaletteList,
  useCommandPalette,
} from '@agent-x/design';
import {
  Bot,
  Database,
  Key,
  MessageSquarePlus,
  Monitor,
  Moon,
  Plus,
  Server,
  Settings,
  Sparkles,
  Sun,
  Users,
  Wrench,
} from 'lucide-react';

import { useIsAdmin } from '@/hooks/use-auth';
import { useThemeStore } from '@/stores/theme-store';

export function AppCommandPalette() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const setTheme = useThemeStore(s => s.setTheme);
  const { open, setOpen } = useCommandPalette();

  const handleSelect = (action: () => void) => {
    action();
    setOpen(false);
  };

  return (
    <CommandPalette open={open} onOpenChange={setOpen}>
      <CommandPaletteInput placeholder="Search commands..." />
      <CommandPaletteList>
        <CommandPaletteEmpty>No results found.</CommandPaletteEmpty>

        <CommandPaletteGroup heading="Navigation">
          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/providers'))}
          >
            <CommandPaletteItemIcon>
              <Database className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.providers')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/agents'))}
          >
            <CommandPaletteItemIcon>
              <Bot className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.agents')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/mcp-servers'))}
          >
            <CommandPaletteItemIcon>
              <Server className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.mcpServers')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/prompts'))}
          >
            <CommandPaletteItemIcon>
              <MessageSquarePlus className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.prompts')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/skills'))}
          >
            <CommandPaletteItemIcon>
              <Sparkles className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.skills')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/api-keys'))}
          >
            <CommandPaletteItemIcon>
              <Key className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.apiKeys')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/settings'))}
          >
            <CommandPaletteItemIcon>
              <Settings className="size-full" />
            </CommandPaletteItemIcon>
            {t('nav.preferences')}
          </CommandPaletteItem>

          {isAdmin && (
            <CommandPaletteItem
              onSelect={() => handleSelect(() => navigate('/users'))}
            >
              <CommandPaletteItemIcon>
                <Users className="size-full" />
              </CommandPaletteItemIcon>
              {t('nav.users')}
            </CommandPaletteItem>
          )}

          {isAdmin && (
            <CommandPaletteItem
              onSelect={() => handleSelect(() => navigate('/system-config'))}
            >
              <CommandPaletteItemIcon>
                <Wrench className="size-full" />
              </CommandPaletteItemIcon>
              {t('nav.systemConfig')}
            </CommandPaletteItem>
          )}
        </CommandPaletteGroup>

        <CommandPaletteGroup heading="Actions">
          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/agents/new'))}
          >
            <CommandPaletteItemIcon>
              <Plus className="size-full" />
            </CommandPaletteItemIcon>
            {t('agents.createAgent')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/providers/new'))}
          >
            <CommandPaletteItemIcon>
              <Plus className="size-full" />
            </CommandPaletteItemIcon>
            {t('providers.addProvider')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/skills/new'))}
          >
            <CommandPaletteItemIcon>
              <Plus className="size-full" />
            </CommandPaletteItemIcon>
            {t('skills.createSkill')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/mcp-servers/new'))}
          >
            <CommandPaletteItemIcon>
              <Plus className="size-full" />
            </CommandPaletteItemIcon>
            {t('mcp.addServer')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => navigate('/prompts/new'))}
          >
            <CommandPaletteItemIcon>
              <Plus className="size-full" />
            </CommandPaletteItemIcon>
            {t('prompts.createPrompt')}
          </CommandPaletteItem>
        </CommandPaletteGroup>

        <CommandPaletteGroup heading="Theme">
          <CommandPaletteItem
            onSelect={() => handleSelect(() => setTheme('light'))}
          >
            <CommandPaletteItemIcon>
              <Sun className="size-full" />
            </CommandPaletteItemIcon>
            {t('settings.light')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => setTheme('dark'))}
          >
            <CommandPaletteItemIcon>
              <Moon className="size-full" />
            </CommandPaletteItemIcon>
            {t('settings.dark')}
          </CommandPaletteItem>

          <CommandPaletteItem
            onSelect={() => handleSelect(() => setTheme('system'))}
          >
            <CommandPaletteItemIcon>
              <Monitor className="size-full" />
            </CommandPaletteItemIcon>
            {t('settings.system')}
          </CommandPaletteItem>
        </CommandPaletteGroup>
      </CommandPaletteList>
    </CommandPalette>
  );
}
