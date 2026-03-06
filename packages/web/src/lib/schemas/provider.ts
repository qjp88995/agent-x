import { ProviderProtocol } from '@agent-x/shared';
import { z } from 'zod';

const protocolValues = Object.values(ProviderProtocol) as [string, ...string[]];

export const createProviderSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  protocol: z.enum(protocolValues),
  baseUrl: z.url('validation.invalidUrl'),
  apiKey: z.string().min(1, 'validation.required'),
});

export const updateProviderSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  baseUrl: z.url('validation.invalidUrl'),
  apiKey: z.string().optional(),
});

export type CreateProviderFormValues = z.infer<typeof createProviderSchema>;
export type UpdateProviderFormValues = z.infer<typeof updateProviderSchema>;
