import { Injectable, Logger } from '@nestjs/common';

import { createMCPClient, type MCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
import type { Tool } from 'ai';

type McpToolSet = Record<string, Tool>;

interface McpSessionResult {
  readonly tools: McpToolSet;
  readonly cleanup: () => Promise<void>;
}

const MCP_SESSION_TIMEOUT_MS = 30_000;

@Injectable()
export class McpClientService {
  private readonly logger = new Logger(McpClientService.name);

  private withTimeout<T>(
    promise: Promise<T>,
    ms: number,
    label: string
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(
        () =>
          reject(new Error(`MCP operation timed out after ${ms}ms: ${label}`)),
        ms
      );
      promise.then(
        value => {
          clearTimeout(timer);
          resolve(value);
        },
        error => {
          clearTimeout(timer);
          reject(error);
        }
      );
    });
  }

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
    const label =
      transport === 'STDIO'
        ? `${transport}:${config.command}`
        : `${transport}:${config.url}`;

    const client = await this.withTimeout(
      this.createClient(transport, config),
      MCP_SESSION_TIMEOUT_MS,
      `createClient(${label})`
    );

    try {
      const result = await this.withTimeout(
        client.listTools(),
        MCP_SESSION_TIMEOUT_MS,
        `listTools(${label})`
      );
      return result.tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema as Record<string, unknown> | undefined,
      }));
    } finally {
      await client.close().catch(() => {});
    }
  }

  async createMcpSession(
    transport: string,
    config: Record<string, unknown>,
    enabledTools: string[]
  ): Promise<McpSessionResult> {
    const label =
      transport === 'STDIO'
        ? `${transport}:${config.command}`
        : `${transport}:${config.url}`;

    const client = await this.withTimeout(
      this.createClient(transport, config),
      MCP_SESSION_TIMEOUT_MS,
      `createClient(${label})`
    );

    try {
      const allTools = await this.withTimeout(
        client.tools(),
        MCP_SESSION_TIMEOUT_MS,
        `listTools(${label})`
      );
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
      await client.close().catch(() => {});
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
