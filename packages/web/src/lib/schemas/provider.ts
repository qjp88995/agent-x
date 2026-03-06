import { ProviderProtocol } from '@agent-x/shared';
import { z } from 'zod';

const protocolValues = Object.values(ProviderProtocol) as [string, ...string[]];

export const createProviderSchema = z.object({
  name: z.string().min(1),
  protocol: z.enum(protocolValues),
  baseUrl: z.string().url(),
  apiKey: z.string().min(1),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1),
  baseUrl: z.string().url(),
  apiKey: z.string().optional(),
});

export type CreateProviderFormValues = z.infer<typeof createProviderSchema>;
export type UpdateProviderFormValues = z.infer<typeof updateProviderSchema>;
