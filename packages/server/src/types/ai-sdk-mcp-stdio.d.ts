declare module '@ai-sdk/mcp/mcp-stdio' {
  interface StdioConfig {
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }

  export class Experimental_StdioMCPTransport {
    constructor(config: StdioConfig);
    start(): Promise<void>;
    close(): Promise<void>;
    send(message: unknown): Promise<void>;
  }
}
