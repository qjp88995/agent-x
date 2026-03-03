import { Module } from "@nestjs/common";
import { McpService } from "./mcp.service";
import { McpClientService } from "./mcp-client.service";
import { McpController } from "./mcp.controller";

@Module({
  controllers: [McpController],
  providers: [McpService, McpClientService],
  exports: [McpService, McpClientService],
})
export class McpModule {}
