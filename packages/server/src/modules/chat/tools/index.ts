import type { Tool } from 'ai';

import { WorkspaceService } from '../../workspace/workspace.service';
import { getCurrentTimeTool } from './get-current-time';
import { createWorkspaceTools } from './workspace-tools';

export const builtInTools: Record<string, Tool> = {
  getCurrentTime: getCurrentTimeTool,
};

export function getBuiltInTools(
  workspaceService: WorkspaceService | null,
  conversationId?: string
): Record<string, Tool> {
  const tools: Record<string, Tool> = { ...builtInTools };

  if (workspaceService && conversationId) {
    const workspaceTools = createWorkspaceTools(
      workspaceService,
      conversationId
    );
    Object.assign(tools, workspaceTools);
  }

  return tools;
}
