import { z } from 'zod';

export const agentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  providerId: z.string().min(1),
  modelId: z.string().min(1),
  systemPrompt: z.string().min(1),
  temperature: z.coerce.number().min(0).max(2),
  maxTokens: z.coerce.number().int().min(1),
});

export type AgentFormValues = z.infer<typeof agentSchema>;
