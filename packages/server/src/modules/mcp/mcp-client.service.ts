import { Injectable, Logger } from '@nestjs/common';

import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import type { Tool } from 'ai';

type McpToolSet = Record<string, Tool>;

interface McpSessionResult {
  readonly tools: McpToolSet;
  readonly cleanup: () => Promise<void>;
}

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);

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
    const client = await this.createClient(transport, config);

    try {
      const result = await client.listTools();
      return result.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
      }));
    } finally {
      await client.close();
    }
  }

  async createMcpSession(
    transport: string,
    config: Record<string, unknown>,
    enabledTools: string[]
  ): Promise<McpSessionResult> {
    const client = await this.createClient(transport, config);

    try {
      const allTools = await client.tools();
      const filteredTools =
        enabledTools.length > 0
          ? Object.fromEntries(
              Object.entries(allTools).filter(([name]) =>
                enabledTools.includes(name)
              )
            )
          : allTools;

      return {
        tools: filteredTools as McpToolSet,
        cleanup: () => client.close(),
      };
    } catch (error) {
      await client.close();
      throw error;
    }
  }

  private async createClient(
    transport: string,
    config: Record<string, unknown>
  ): Promise<MCPClient> {
    switch (transport) {
      case 'STDIO': {
        const stdioTransport = new Experimental_StdioMCPTransport({
          command: config.command as string,
          args: (config.args as string[]) ?? [],
          env: config.env as Record<string, string> | undefined,
        });
        return createMCPClient({ transport: stdioTransport });
      }
      case 'SSE': {
        return createMCPClient({
          transport: {
            type: 'sse',
            url: config.url as string,
            headers: config.headers as Record<string, string> | undefined,
          },
        });
      }
      case 'STREAMABLE_HTTP': {
        return createMCPClient({
          transport: {
            type: 'http',
            url: config.url as string,
            headers: config.headers as Record<string, string> | undefined,
          },
        });
      }
      default:
        throw new Error(`Unsupported MCP transport: ${transport}`);
    }
  }
}
