import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  description: z.string().optional(),
  providerId: z.string().min(1, 'validation.required'),
  modelId: z.string().min(1, 'validation.required'),
  systemPrompt: z.string().min(1, 'validation.required'),
  temperature: z
    .number()
    .min(0, 'validation.temperatureRange')
    .max(2, 'validation.temperatureRange'),
  maxTokens: z.number().int().min(1, 'validation.maxTokensMin'),
});

export type AgentFormValues = z.infer<typeof agentSchema>;
