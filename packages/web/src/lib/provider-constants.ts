import type { ProviderProtocol as ProviderProtocolType } from '@agent-x/shared';
import { ProviderProtocol } from '@agent-x/shared';

export const DEFAULT_BASE_URLS: Record<ProviderProtocolType, string> = {
  OPENAI: 'https://api.openai.com/v1',
  ANTHROPIC: 'https://api.anthropic.com',
  GEMINI: 'https://generativelanguage.googleapis.com/v1beta',
  DEEPSEEK: 'https://api.deepseek.com',
  QWEN: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  ZHIPU: 'https://open.bigmodel.cn/api/paas/v4/',
  MOONSHOT: 'https://api.moonshot.ai/v1',
};

export const PROTOCOL_OPTIONS: readonly {
  value: ProviderProtocolType;
  labelKey: string;
  descKey: string;
}[] = [
  {
    value: ProviderProtocol.OPENAI,
    labelKey: 'providers.openai',
    descKey: 'providers.openaiDesc',
  },
  {
    value: ProviderProtocol.ANTHROPIC,
    labelKey: 'providers.anthropic',
    descKey: 'providers.anthropicDesc',
  },
  {
    value: ProviderProtocol.GEMINI,
    labelKey: 'providers.gemini',
    descKey: 'providers.geminiDesc',
  },
  {
    value: ProviderProtocol.DEEPSEEK,
    labelKey: 'providers.deepseek',
    descKey: 'providers.deepseekDesc',
  },
  {
    value: ProviderProtocol.QWEN,
    labelKey: 'providers.qwen',
    descKey: 'providers.qwenDesc',
  },
  {
    value: ProviderProtocol.ZHIPU,
    labelKey: 'providers.zhipu',
    descKey: 'providers.zhipuDesc',
  },
  {
    value: ProviderProtocol.MOONSHOT,
    labelKey: 'providers.moonshot',
    descKey: 'providers.moonshotDesc',
  },
] as const;

export const PROTOCOL_CONFIG: Record<
  ProviderProtocolType,
  { labelKey: string; className: string }
> = {
  OPENAI: {
    labelKey: 'providers.openai',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  ANTHROPIC: {
    labelKey: 'providers.anthropic',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
  GEMINI: {
    labelKey: 'providers.gemini',
    className:
      'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  },
  DEEPSEEK: {
    labelKey: 'providers.deepseek',
    className:
      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  },
  QWEN: {
    labelKey: 'providers.qwen',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  },
  ZHIPU: {
    labelKey: 'providers.zhipu',
    className:
      'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400',
  },
  MOONSHOT: {
    labelKey: 'providers.moonshot',
    className:
      'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  },
};
