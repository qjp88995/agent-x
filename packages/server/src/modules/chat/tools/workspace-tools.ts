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

    fileExists: tool({
      description:
        'Check if a file or directory exists in the workspace. This is a lightweight check that does not read file content.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file or directory path to check',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          const result = await workspaceService.fileExists(
            conversationId,
            path
          );
          return { success: true, ...result };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    fileInfo: tool({
      description:
        'Get file metadata (size, MIME type, line count for text files) without reading the full content. Use this instead of readFile when you only need to check file properties.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to inspect',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          const result = await workspaceService.getFileStats(
            conversationId,
            path
          );
          return { success: true, ...result };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    readFileLines: tool({
      description:
        'Read specific lines from a text file in the workspace. Use this instead of readFile when you only need to read a portion of a large file. Line numbers are 1-based.',
      inputSchema: jsonSchema<{
        path: string;
        startLine: number;
        endLine: number;
      }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to read',
          },
          startLine: {
            type: 'number',
            description: 'Start line number (1-based, inclusive)',
          },
          endLine: {
            type: 'number',
            description: 'End line number (1-based, inclusive)',
          },
        },
        required: ['path', 'startLine', 'endLine'],
      }),
      execute: async ({ path, startLine, endLine }) => {
        try {
          const result = await workspaceService.readFileLines(
            conversationId,
            path,
            startLine,
            endLine
          );
          return { success: true, ...result };
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

    searchFiles: tool({
      description:
        'Search for text across workspace files (case-insensitive). Returns matching lines with line numbers. Optionally restrict search to a subdirectory.',
      inputSchema: jsonSchema<{ query: string; path?: string }>({
        type: 'object',
        properties: {
          query: {
            type: 'string',
            description: 'Text to search for (case-insensitive)',
          },
          path: {
            type: 'string',
            description: 'Optional subdirectory path to limit the search scope',
          },
        },
        required: ['query'],
      }),
      execute: async ({ query, path }) => {
        try {
          const results = await workspaceService.searchFiles(
            conversationId,
            query,
            path
          );
          return { success: true, results };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    patchFile: tool({
      description:
        'Apply a find-and-replace edit to a text file. Replaces all occurrences of the search string with the replacement string. Use this instead of updateFile when you only need to change a small part of a large file.',
      inputSchema: jsonSchema<{
        path: string;
        search: string;
        replace: string;
      }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative file path to patch',
          },
          search: {
            type: 'string',
            description: 'Exact text to find in the file',
          },
          replace: {
            type: 'string',
            description: 'Text to replace the search string with',
          },
        },
        required: ['path', 'search', 'replace'],
      }),
      execute: async ({ path, search, replace }) => {
        try {
          const result = await workspaceService.patchFile(
            conversationId,
            path,
            search,
            replace
          );
          return { success: true, ...result };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    renameFile: tool({
      description: 'Rename or move a file within the workspace.',
      inputSchema: jsonSchema<{ oldPath: string; newPath: string }>({
        type: 'object',
        properties: {
          oldPath: {
            type: 'string',
            description: 'Current relative file path',
          },
          newPath: {
            type: 'string',
            description: 'New relative file path',
          },
        },
        required: ['oldPath', 'newPath'],
      }),
      execute: async ({ oldPath, newPath }) => {
        try {
          const file = await workspaceService.renameFile(
            conversationId,
            oldPath,
            newPath
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

    createDirectory: tool({
      description: 'Create a directory in the workspace.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description:
              'Relative directory path to create (parent directories will be created automatically)',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          const dir = await workspaceService.createDirectory(
            conversationId,
            path
          );
          return {
            success: true,
            directory: { id: dir.id, path: dir.path },
          };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    deleteDirectory: tool({
      description:
        'Delete a directory and all its contents from the workspace.',
      inputSchema: jsonSchema<{ path: string }>({
        type: 'object',
        properties: {
          path: {
            type: 'string',
            description: 'Relative directory path to delete',
          },
        },
        required: ['path'],
      }),
      execute: async ({ path }) => {
        try {
          const deletedPaths = await workspaceService.deleteDirectory(
            conversationId,
            path
          );
          return { success: true, deletedPaths };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),

    renameDirectory: tool({
      description:
        'Rename or move a directory within the workspace. All files inside the directory are moved along with it.',
      inputSchema: jsonSchema<{ oldPath: string; newPath: string }>({
        type: 'object',
        properties: {
          oldPath: {
            type: 'string',
            description: 'Current relative directory path',
          },
          newPath: {
            type: 'string',
            description: 'New relative directory path',
          },
        },
        required: ['oldPath', 'newPath'],
      }),
      execute: async ({ oldPath, newPath }) => {
        try {
          await workspaceService.renameDirectory(
            conversationId,
            oldPath,
            newPath
          );
          return { success: true, oldPath, newPath };
        } catch (error: any) {
          return { success: false, error: error.message };
        }
      },
    }),
  };
}
