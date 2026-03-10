import { z } from 'zod';

export const createUserSchema = z.object({
  email: z.string().email('validation.invalidEmail'),
  password: z.string().min(8, 'validation.passwordMin'),
  name: z.string().optional(),
  role: z.string().optional(),
});

export type CreateUserFormValues = z.infer<typeof createUserSchema>;
