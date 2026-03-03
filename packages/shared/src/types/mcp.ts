export const McpType = {
  OFFICIAL: 'OFFICIAL',
  CUSTOM: 'CUSTOM',
} as const;

export type McpType = (typeof McpType)[keyof typeof McpType];

export const McpTransport = {
  STDIO: 'STDIO',
  SSE: 'SSE',
  STREAMABLE_HTTP: 'STREAMABLE_HTTP',
} as const;

export type McpTransport = (typeof McpTransport)[keyof typeof McpTransport];

export interface CreateMcpServerDto {
  name: string;
  description?: string;
  transport: McpTransport;
  config: Record<string, unknown>;
}

export interface UpdateMcpServerDto {
  name?: string;
  description?: string;
  transport?: McpTransport;
  config?: Record<string, unknown>;
}

export interface McpServerResponse {
  id: string;
  name: string;
  description: string | null;
  type: McpType;
  transport: McpTransport;
  config: Record<string, unknown>;
  tools: McpToolInfo[] | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface McpToolInfo {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}
