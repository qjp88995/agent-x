import { z } from 'zod';

export const skillSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  tags: z.string().optional(),
  content: z.string().min(1),
});

export type SkillFormValues = z.infer<typeof skillSchema>;
