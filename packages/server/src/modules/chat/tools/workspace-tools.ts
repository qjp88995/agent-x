import { jsonSchema, tool } from 'ai';

import { WorkspaceService } from '../../workspace/workspace.service';

export function createWorkspaceTools(
  workspaceService: WorkspaceService,
  conversationId: string
) {
  return {
    createFile: tool({
      description:
        'Create a new file in the workspace. For text files, provide content as a string. For binary files, provide base64-encoded content.',
      inputSchema: jsonSchema<{ path: string; content: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'Relative file path (e.g. "src/App.tsx"). Must not contain ".." or be absolute.',
          },
          content: {
            type: 'string',
            description: 'File content (text string or base64 for binary)',
          },
        },
        required: ['path', 'content'],
      }),
      execute: async ({ path, content }) => {
        try {
          const file = await workspaceService.createFile(
            conversationId,
            path,
            content
          );
          return {
            success: true,
            file: {
              id: file.id,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    readFile: tool({
      description:
        'Read a file from the workspace. Returns text content for text files and base64-encoded content for binary files.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to read',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          const result = await workspaceService.readFile(conversationId, path);
          return {
            success: true,
            content: result.content,
            mimeType: result.mimeType,
            size: result.size,
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    updateFile: tool({
      description: 'Update the content of an existing file in the workspace.',
      inputSchema: jsonSchema<{ path: string; content: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to update',
          },
          content: {
            type: 'string',
            description: 'New file content',
          },
        },
        required: ['path', 'content'],
      }),
      execute: async ({ path, content }) => {
        try {
          const file = await workspaceService.updateFile(
            conversationId,
            path,
            content
          );
          return {
            success: true,
            file: {
              id: file.id,
              path: file.path,
              mimeType: file.mimeType,
              size: file.size,
            },
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    deleteFile: tool({
      description: 'Delete a file from the workspace.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to delete',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          await workspaceService.deleteFile(conversationId, path);
          return { success: true, path };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    writeFiles: tool({
      description:
        'Write multiple files to the workspace atomically. All files are written or none (atomic batch operation).',
      inputSchema: jsonSchema<{
        files: Array<{ path: string; content: string }>;
      }>({
        type: 'object',
        properties: {
          files: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                path: {
                  type: 'string',
                  description: 'Relative file path',
                },
                content: {
                  type: 'string',
                  description: 'File content',
                },
              },
              required: ['path', 'content'],
            },
            description: 'Array of files to write',
          },
        },
        required: ['files'],
      }),
      execute: async ({ files }) => {
        try {
          const results = await workspaceService.writeFiles(
            conversationId,
            files
          );
          return {
            success: true,
            files: results.map(f => ({
              id: f.id,
              path: f.path,
              mimeType: f.mimeType,
              size: f.size,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    listFiles: tool({
      description:
        'List all files in the workspace or in a specific subdirectory.',
      inputSchema: jsonSchema<{ path?: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'Optional subdirectory path to list. If omitted, lists all files.',
          },
        },
      }),
      execute: async ({ path }) => {
        try {
          const files = await workspaceService.listFiles(conversationId, path);
          return {
            success: true,
            files: files.map(f => ({
              id: f.id,
              path: f.path,
              mimeType: f.mimeType,
              size: f.size,
            })),
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),
  };
}
