import { useTranslation } from 'react-i18next';

import type { Locale } from 'date-fns';
import { enUS, zhCN } from 'date-fns/locale';

const LOCALE_MAP: Record<string, Locale> = {
  zh: zhCN,
  en: enUS,
};

export function useDateLocale(): Locale {
  const { i18n } = useTranslation();
  return LOCALE_MAP[i18n.language] ?? enUS;
}
