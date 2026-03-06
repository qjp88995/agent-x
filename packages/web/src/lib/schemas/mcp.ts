import { McpTransport } from '@agent-x/shared';
import { z } from 'zod';

const transportValues = Object.values(McpTransport) as [string, ...string[]];

export const mcpSchema = z
  .object({
    name: z.string().min(1, 'validation.required'),
    description: z.string().optional(),
    transport: z.enum(transportValues),
    command: z.string().optional(),
    args: z.string().optional(),
    url: z.string().optional(),
    headers: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.transport === McpTransport.STDIO) {
      if (!data.command?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'validation.commandRequired',
          path: ['command'],
        });
      }
    } else {
      if (!data.url?.trim()) {
        ctx.addIssue({
          code: 'custom',
          message: 'validation.urlRequired',
          path: ['url'],
        });
      }
    }

    if (data.headers?.trim()) {
      try {
        const parsed = JSON.parse(data.headers);
        if (typeof parsed !== 'object' || Array.isArray(parsed)) {
          ctx.addIssue({
            code: 'custom',
            message: 'validation.headersMustBeObject',
            path: ['headers'],
          });
        }
      } catch {
        ctx.addIssue({
          code: 'custom',
          message: 'validation.headersMustBeJson',
          path: ['headers'],
        });
      }
    }
  });

export type McpFormValues = z.infer<typeof mcpSchema>;
