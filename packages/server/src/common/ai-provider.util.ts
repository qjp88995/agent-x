import { createAlibaba } from '@ai-sdk/alibaba';
import { createAnthropic } from '@ai-sdk/anthropic';
import { createDeepSeek } from '@ai-sdk/deepseek';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createMoonshotAI } from '@ai-sdk/moonshotai';
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModel } from 'ai';
import { createZhipu } from 'zhipu-ai-provider';

// ---------------------------------------------------------------------------
// Temperature clamping
// ---------------------------------------------------------------------------

/** Max temperature by protocol. Most accept 0–2; Zhipu/Moonshot only 0–1. */
const MAX_TEMPERATURE: Record<string, number> = {
  ZHIPU: 1,
  MOONSHOT: 1,
};

const DEFAULT_MAX_TEMPERATURE = 2;

export function clampTemperature(
  protocol: string,
  temperature: number
): number {
  const maxTemp = MAX_TEMPERATURE[protocol] ?? DEFAULT_MAX_TEMPERATURE;
  return Math.min(Math.max(temperature, 0), maxTemp);
}

// ---------------------------------------------------------------------------
// Thinking / reasoning provider options
// ---------------------------------------------------------------------------

const DEFAULT_THINKING_BUDGET = 8192;

/**
 * Build providerOptions for thinking/reasoning based on protocol and toggle.
 */
export function getThinkingProviderOptions(
  protocol: string,
  enabled: boolean,
  maxTokens: number = DEFAULT_THINKING_BUDGET
): Record<string, unknown> {
  switch (protocol) {
    case 'ANTHROPIC':
      return {
        providerOptions: {
          anthropic: {
            thinking: enabled
              ? { type: 'enabled', budgetTokens: maxTokens }
              : { type: 'disabled' },
          },
        },
      };
    case 'DEEPSEEK':
      return {
        providerOptions: {
          deepseek: {
            thinking: enabled ? { type: 'enabled' } : { type: 'disabled' },
          },
        },
      };
    case 'MOONSHOT':
      return {
        providerOptions: {
          moonshotai: {
            thinking: enabled
              ? { type: 'enabled', budgetTokens: maxTokens }
              : { type: 'disabled' },
          },
        },
      };
    case 'ZHIPU':
      return {
        providerOptions: {
          zhipu: {
            thinking: enabled ? { type: 'enabled' } : { type: 'disabled' },
          },
        },
      };
    case 'QWEN':
      return enabled
        ? {
            providerOptions: {
              alibaba: { enableThinking: true, thinkingBudget: maxTokens },
            },
          }
        : {
            providerOptions: {
              alibaba: { enableThinking: false },
            },
          };
    case 'GEMINI':
      return enabled
        ? {
            providerOptions: {
              google: {
                thinkingConfig: {
                  includeThoughts: true,
                  thinkingBudget: maxTokens,
                },
              },
            },
          }
        : {};
    case 'OPENAI':
    default:
      return {};
  }
}

// ---------------------------------------------------------------------------
// Model creation
// ---------------------------------------------------------------------------

/** Default lightweight model per protocol, used for connection tests etc. */
const DEFAULT_MODEL_ID: Record<string, string> = {
  OPENAI: 'gpt-4o-mini',
  ANTHROPIC: 'claude-3-5-haiku-20241022',
  GEMINI: 'gemini-2.0-flash',
  DEEPSEEK: 'deepseek-chat',
  QWEN: 'qwen-turbo',
  ZHIPU: 'glm-4-flash',
  MOONSHOT: 'moonshot-v1-8k',
};

export function getDefaultModelId(protocol: string): string {
  const modelId = DEFAULT_MODEL_ID[protocol];
  if (!modelId) {
    throw new Error(`No default model for protocol: ${protocol}`);
  }
  return modelId;
}

export function createLanguageModel(
  protocol: string,
  baseUrl: string,
  apiKey: string,
  modelId: string
): LanguageModel {
  switch (protocol) {
    case 'OPENAI': {
      const openai = createOpenAI({ baseURL: baseUrl, apiKey });
      return openai.chat(modelId);
    }
    case 'ANTHROPIC': {
      const anthropic = createAnthropic({ baseURL: baseUrl, apiKey });
      return anthropic(modelId);
    }
    case 'GEMINI': {
      const google = createGoogleGenerativeAI({ baseURL: baseUrl, apiKey });
      return google(modelId);
    }
    case 'DEEPSEEK':
      return createDeepSeek({ baseURL: baseUrl, apiKey })(modelId);
    case 'QWEN':
      return createAlibaba({ baseURL: baseUrl, apiKey })(modelId);
    case 'ZHIPU':
      return createZhipu({ baseURL: baseUrl, apiKey })(modelId);
    case 'MOONSHOT':
      return createMoonshotAI({ baseURL: baseUrl, apiKey })(modelId);
    default:
      throw new Error(`Unsupported protocol: ${protocol}`);
  }
}
