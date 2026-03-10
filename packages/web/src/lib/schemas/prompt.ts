import { z } from 'zod';

export const promptSchema = z.object({
  name: z.string().min(1, 'validation.required'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  tags: z.string().optional(),
  content: z.string().min(1, 'validation.required'),
});

export type PromptFormValues = z.infer<typeof promptSchema>;
