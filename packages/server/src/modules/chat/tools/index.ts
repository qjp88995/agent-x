import type { Tool } from 'ai';

import { getCurrentTimeTool } from './get-current-time';

export const builtInTools: Record<string, Tool> = {
  getCurrentTime: getCurrentTimeTool,
};
