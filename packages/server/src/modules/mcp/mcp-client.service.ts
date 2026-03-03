import { Injectable } from '@nestjs/common';

@Injectable()
export class McpClientService {
  async getTools(
    transport: string,
    config: Record<string, unknown>
  ): Promise<
    Array<{
      name: string;
      description?: string;
      inputSchema?: Record<string, unknown>;
    }>
  > {
    // For now, return empty array - actual MCP connection will be implemented
    // when @ai-sdk/mcp is configured
    // This keeps the module working without the MCP dependency
    void transport;
    void config;
    return [];
  }
}
