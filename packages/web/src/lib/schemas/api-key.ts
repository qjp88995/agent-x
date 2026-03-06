import { z } from 'zod';

export const createApiKeySchema = z.object({
  name: z.string().min(1),
  agentId: z.string().optional(),
  expiresAt: z.date().optional(),
});

export type CreateApiKeyFormValues = z.infer<typeof createApiKeySchema>;
