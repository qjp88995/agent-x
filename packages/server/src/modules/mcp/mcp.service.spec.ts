import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { McpTransport, McpType } from '../../generated/prisma/client';
import { McpService } from './mcp.service';
import { McpClientService } from './mcp-client.service';

jest.mock('../../generated/prisma/client', () => ({
  McpType: {
    OFFICIAL: 'OFFICIAL',
    CUSTOM: 'CUSTOM',
  },
  McpTransport: {
    STDIO: 'STDIO',
    SSE: 'SSE',
    STREAMABLE_HTTP: 'STREAMABLE_HTTP',
  },
}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const MOCK_USER_ID = 'cuid-user-1';
const MOCK_OTHER_USER_ID = 'cuid-user-2';
const MOCK_MCP_ID = 'cuid-mcp-1';

const mockCustomMcp = {
  id: MOCK_MCP_ID,
  name: 'Custom MCP Server',
  description: 'A custom MCP server',
  type: McpType.CUSTOM,
  transport: McpTransport.STDIO,
  config: { command: 'node', args: ['server.js'] },
  tools: null,
  isPublic: false,
  createdBy: MOCK_USER_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockOfficialMcp = {
  id: 'cuid-mcp-official',
  name: 'Official MCP Server',
  description: 'An official MCP server',
  type: McpType.OFFICIAL,
  transport: McpTransport.SSE,
  config: { url: 'https://mcp.example.com/sse' },
  tools: [{ name: 'search', description: 'Search the web' }],
  isPublic: true,
  createdBy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPublicMcp = {
  id: 'cuid-mcp-public',
  name: 'Public MCP Server',
  description: 'A public custom MCP server',
  type: McpType.CUSTOM,
  transport: McpTransport.STREAMABLE_HTTP,
  config: { url: 'https://mcp.example.com/http' },
  tools: null,
  isPublic: true,
  createdBy: MOCK_OTHER_USER_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  mcpServer: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

const mockMcpClientService = {
  getTools: jest.fn(),
};

describe('McpService', () => {
  let service: McpService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        McpService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: McpClientService, useValue: mockMcpClientService },
      ],
    }).compile();

    service = module.get<McpService>(McpService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create CUSTOM MCP server with SSE transport', async () => {
      const sseMcp = {
        ...mockCustomMcp,
        transport: McpTransport.SSE,
        config: { url: 'https://mcp.example.com/sse' },
      };
      mockPrismaService.mcpServer.create.mockResolvedValue(sseMcp);

      const dto = {
        name: 'Custom MCP Server',
        description: 'A custom MCP server',
        transport: McpTransport.SSE,
        config: { url: 'https://mcp.example.com/sse' },
      };

      const result = await service.create(MOCK_USER_ID, dto);

      expect(mockPrismaService.mcpServer.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          transport: dto.transport,
          config: dto.config,
          type: McpType.CUSTOM,
          createdBy: MOCK_USER_ID,
        },
      });
      expect(result).toEqual(sseMcp);
    });

    it('should reject STDIO transport for user-created servers', async () => {
      const dto = {
        name: 'STDIO Server',
        description: 'A STDIO MCP server',
        transport: McpTransport.STDIO,
        config: { command: 'node', args: ['server.js'] },
      };

      await expect(service.create(MOCK_USER_ID, dto)).rejects.toThrow(
        BadRequestException
      );

      expect(mockPrismaService.mcpServer.create).not.toHaveBeenCalled();
    });
  });

  describe('findMarket', () => {
    it('should return OFFICIAL + public servers', async () => {
      const marketServers = [mockOfficialMcp, mockPublicMcp];
      mockPrismaService.mcpServer.findMany.mockResolvedValue(marketServers);

      const result = await service.findMarket();

      expect(mockPrismaService.mcpServer.findMany).toHaveBeenCalledWith({
        where: {
          OR: [{ type: McpType.OFFICIAL }, { isPublic: true }],
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(2);
    });
  });

  describe('findAll', () => {
    it("should return user's custom servers", async () => {
      mockPrismaService.mcpServer.findMany.mockResolvedValue([mockCustomMcp]);

      const result = await service.findAll(MOCK_USER_ID);

      expect(mockPrismaService.mcpServer.findMany).toHaveBeenCalledWith({
        where: {
          createdBy: MOCK_USER_ID,
          type: McpType.CUSTOM,
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
    });
  });

  describe('findOne', () => {
    it('should return MCP server by id', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      const result = await service.findOne(MOCK_MCP_ID);

      expect(mockPrismaService.mcpServer.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_MCP_ID },
      });
      expect(result).toEqual(mockCustomMcp);
    });

    it('should throw NotFoundException when MCP server not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update when user is owner', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);
      const updatedMcp = { ...mockCustomMcp, name: 'Updated MCP' };
      mockPrismaService.mcpServer.update.mockResolvedValue(updatedMcp);

      const result = await service.update(MOCK_MCP_ID, MOCK_USER_ID, {
        name: 'Updated MCP',
      });

      expect(mockPrismaService.mcpServer.update).toHaveBeenCalledWith({
        where: { id: MOCK_MCP_ID },
        data: { name: 'Updated MCP' },
      });
      expect(result.name).toBe('Updated MCP');
    });

    it('should throw ForbiddenException for OFFICIAL servers', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockOfficialMcp);

      await expect(
        service.update('cuid-mcp-official', MOCK_USER_ID, {
          name: 'Hacked',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.mcpServer.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      await expect(
        service.update(MOCK_MCP_ID, MOCK_OTHER_USER_ID, {
          name: 'Hacked',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.mcpServer.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when MCP server not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', MOCK_USER_ID, { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete when user is owner', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);
      mockPrismaService.mcpServer.delete.mockResolvedValue(mockCustomMcp);

      const result = await service.remove(MOCK_MCP_ID, MOCK_USER_ID);

      expect(mockPrismaService.mcpServer.delete).toHaveBeenCalledWith({
        where: { id: MOCK_MCP_ID },
      });
      expect(result).toEqual({
        message: 'MCP server deleted successfully',
      });
    });

    it('should throw ForbiddenException for OFFICIAL servers', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockOfficialMcp);

      await expect(
        service.remove('cuid-mcp-official', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.mcpServer.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      await expect(
        service.remove(MOCK_MCP_ID, MOCK_OTHER_USER_ID)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.mcpServer.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when MCP server not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createOfficial', () => {
    it('should create OFFICIAL MCP server', async () => {
      mockPrismaService.mcpServer.create.mockResolvedValue(mockOfficialMcp);

      const dto = {
        name: 'Official MCP Server',
        description: 'An official MCP server',
        transport: McpTransport.SSE,
        config: { url: 'https://mcp.example.com/sse' },
      };

      const result = await service.createOfficial(dto);

      expect(mockPrismaService.mcpServer.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          transport: dto.transport,
          config: dto.config,
          type: McpType.OFFICIAL,
          isPublic: true,
          createdBy: null,
        },
      });
      expect(result).toEqual(mockOfficialMcp);
    });
  });

  describe('updateOfficial', () => {
    it('should update OFFICIAL server', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockOfficialMcp);
      const updatedMcp = { ...mockOfficialMcp, name: 'Updated Official' };
      mockPrismaService.mcpServer.update.mockResolvedValue(updatedMcp);

      const result = await service.updateOfficial('cuid-mcp-official', {
        name: 'Updated Official',
      });

      expect(mockPrismaService.mcpServer.update).toHaveBeenCalledWith({
        where: { id: 'cuid-mcp-official' },
        data: { name: 'Updated Official' },
      });
      expect(result.name).toBe('Updated Official');
    });

    it('should throw ForbiddenException for non-OFFICIAL server', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      await expect(
        service.updateOfficial(MOCK_MCP_ID, { name: 'Hacked' })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.mcpServer.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.updateOfficial('nonexistent-id', { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeOfficial', () => {
    it('should delete OFFICIAL server', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockOfficialMcp);
      mockPrismaService.mcpServer.delete.mockResolvedValue(mockOfficialMcp);

      const result = await service.removeOfficial('cuid-mcp-official');

      expect(mockPrismaService.mcpServer.delete).toHaveBeenCalledWith({
        where: { id: 'cuid-mcp-official' },
      });
      expect(result).toEqual({
        message: 'Marketplace server deleted successfully',
      });
    });

    it('should throw ForbiddenException for non-OFFICIAL server', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      await expect(service.removeOfficial(MOCK_MCP_ID)).rejects.toThrow(
        ForbiddenException
      );

      expect(mockPrismaService.mcpServer.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(service.removeOfficial('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('testConnection', () => {
    it('should use McpClientService and update tools', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);
      const mockTools = [
        { name: 'search', description: 'Search the web' },
        { name: 'browse', description: 'Browse a URL' },
      ];
      mockMcpClientService.getTools.mockResolvedValue(mockTools);
      mockPrismaService.mcpServer.update.mockResolvedValue({
        ...mockCustomMcp,
        tools: mockTools,
      });

      const result = await service.testConnection(MOCK_MCP_ID, MOCK_USER_ID);

      expect(mockMcpClientService.getTools).toHaveBeenCalledWith(
        mockCustomMcp.transport,
        mockCustomMcp.config
      );
      expect(mockPrismaService.mcpServer.update).toHaveBeenCalledWith({
        where: { id: MOCK_MCP_ID },
        data: { tools: mockTools },
      });
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
        tools: mockTools,
      });
    });

    it('should return failure when connection fails', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);
      mockMcpClientService.getTools.mockRejectedValue(
        new Error('Connection refused')
      );

      const result = await service.testConnection(MOCK_MCP_ID, MOCK_USER_ID);

      expect(result).toEqual({
        success: false,
        message: 'Connection failed: Connection refused',
      });
    });

    it('should throw NotFoundException when MCP server not found', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(null);

      await expect(
        service.testConnection('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when user is not owner of CUSTOM server', async () => {
      mockPrismaService.mcpServer.findUnique.mockResolvedValue(mockCustomMcp);

      await expect(
        service.testConnection(MOCK_MCP_ID, MOCK_OTHER_USER_ID)
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
