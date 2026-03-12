import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PageHeader,
  StaggerItem,
  StaggerList,
} from '@agent-x/design';
import { Check, Monitor, Moon, Sun } from 'lucide-react';

import { changeLanguage } from '@/i18n';
import { cn } from '@/lib/utils';
import { useThemeStore } from '@/stores/theme-store';

type Theme = 'system' | 'light' | 'dark';

interface ThemeOption {
  readonly value: Theme;
  readonly labelKey: string;
  readonly descKey: string;
  readonly icon: React.ComponentType<{ className?: string }>;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  {
    value: 'system',
    labelKey: 'settings.system',
    descKey: 'settings.systemDesc',
    icon: Monitor,
  },
  {
    value: 'light',
    labelKey: 'settings.light',
    descKey: 'settings.lightDesc',
    icon: Sun,
  },
  {
    value: 'dark',
    labelKey: 'settings.dark',
    descKey: 'settings.darkDesc',
    icon: Moon,
  },
];

interface LanguageOption {
  readonly value: string;
  readonly labelKey: string;
  readonly nativeName: string;
}

const LANGUAGE_OPTIONS: readonly LanguageOption[] = [
  { value: 'zh', labelKey: 'settings.zhCN', nativeName: '简体中文' },
  { value: 'en', labelKey: 'settings.en', nativeName: 'English' },
];

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const theme = useThemeStore(s => s.theme);
  const setTheme = useThemeStore(s => s.setTheme);
  const currentLang = i18n.language?.startsWith('zh') ? 'zh' : 'en';

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('settings.title')}
        description={t('settings.subtitle')}
      />

      <div className="flex-1 overflow-auto p-5">
        <StaggerList className="flex max-w-2xl flex-col gap-6">
          {/* Theme */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.theme')}</CardTitle>
                <CardDescription>{t('settings.themeDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {THEME_OPTIONS.map(option => {
                    const Icon = option.icon;
                    const isActive = theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setTheme(option.value)}
                        className={cn(
                          'relative flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all duration-200 sm:flex-col sm:items-center sm:gap-2 sm:p-4',
                          isActive
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-surface/50'
                        )}
                      >
                        {isActive && (
                          <div className="bg-primary absolute top-2 right-2 flex size-5 items-center justify-center rounded-full">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                        <Icon
                          className={cn(
                            'size-5 shrink-0 sm:size-6',
                            isActive ? 'text-primary' : 'text-foreground-muted'
                          )}
                        />
                        <div className="sm:text-center">
                          <p
                            className={cn(
                              'text-sm font-medium',
                              isActive ? 'text-primary' : 'text-foreground'
                            )}
                          >
                            {t(option.labelKey)}
                          </p>
                          <p className="text-foreground-muted mt-0.5 text-xs">
                            {t(option.descKey)}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>

          {/* Language */}
          <StaggerItem>
            <Card>
              <CardHeader>
                <CardTitle>{t('settings.language')}</CardTitle>
                <CardDescription>{t('settings.languageDesc')}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3">
                  {LANGUAGE_OPTIONS.map(option => {
                    const isActive = currentLang === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => changeLanguage(option.value)}
                        className={cn(
                          'relative flex flex-col items-center gap-1.5 rounded-lg border p-4 transition-all duration-200 cursor-pointer',
                          isActive
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border hover:border-primary/30 hover:bg-surface/50'
                        )}
                      >
                        {isActive && (
                          <div className="bg-primary absolute top-2 right-2 flex size-5 items-center justify-center rounded-full">
                            <Check className="size-3 text-white" />
                          </div>
                        )}
                        <p
                          className={cn(
                            'text-base font-medium',
                            isActive ? 'text-primary' : 'text-foreground'
                          )}
                        >
                          {option.nativeName}
                        </p>
                        <p className="text-foreground-muted text-xs">
                          {t(option.labelKey)}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </StaggerItem>
        </StaggerList>
      </div>
    </div>
  );
}
