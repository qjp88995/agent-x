import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AgentStatus } from '../../generated/prisma/client';
import { AgentService } from './agent.service';

jest.mock('../../generated/prisma/client', () => ({
  AgentStatus: {
    DRAFT: 'DRAFT',
    ARCHIVED: 'ARCHIVED',
  },
}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const MOCK_USER_ID = 'cuid-user-1';
const MOCK_AGENT_ID = 'cuid-agent-1';
const MOCK_PROVIDER_ID = 'cuid-provider-1';
const MOCK_SKILL_ID = 'cuid-skill-1';
const MOCK_MCP_SERVER_ID = 'cuid-mcp-1';

const mockAgent = {
  id: MOCK_AGENT_ID,
  userId: MOCK_USER_ID,
  providerId: MOCK_PROVIDER_ID,
  modelId: 'gpt-4o',
  name: 'Test Agent',
  description: 'A test agent',
  avatar: null,
  systemPrompt: 'You are a helpful assistant.',
  temperature: 0.7,
  maxTokens: 4096,
  status: AgentStatus.DRAFT,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockProvider = {
  id: MOCK_PROVIDER_ID,
  userId: MOCK_USER_ID,
  name: 'OpenAI',
  protocol: 'OPENAI',
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'encrypted-key',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  agent: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  provider: {
    findFirst: jest.fn(),
  },
  agentSkill: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
  agentMcp: {
    create: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
  },
};

describe('AgentService', () => {
  let service: AgentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create agent with DRAFT status', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      mockPrismaService.agent.create.mockResolvedValue(mockAgent);

      const dto = {
        name: 'Test Agent',
        description: 'A test agent',
        providerId: MOCK_PROVIDER_ID,
        modelId: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.',
      };

      const result = await service.create(MOCK_USER_ID, dto);

      expect(mockPrismaService.provider.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_PROVIDER_ID, userId: MOCK_USER_ID },
      });
      expect(mockPrismaService.agent.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          name: dto.name,
          description: dto.description,
          providerId: dto.providerId,
          modelId: dto.modelId,
          systemPrompt: dto.systemPrompt,
          temperature: undefined,
          maxTokens: undefined,
          status: AgentStatus.DRAFT,
        },
      });
      expect(result).toEqual(mockAgent);
    });

    it("should throw NotFoundException if provider not found or doesn't belong to user", async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      const dto = {
        name: 'Test Agent',
        providerId: 'nonexistent-provider',
        modelId: 'gpt-4o',
        systemPrompt: 'You are a helpful assistant.',
      };

      await expect(service.create(MOCK_USER_ID, dto)).rejects.toThrow(
        NotFoundException
      );

      expect(mockPrismaService.agent.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return agents for user with latestVersion', async () => {
      const agents = [
        {
          ...mockAgent,
          provider: {
            id: MOCK_PROVIDER_ID,
            name: 'OpenAI',
            protocol: 'OPENAI',
          },
          _count: { skills: 2, mcpServers: 1 },
          versions: [{ version: 3 }],
        },
      ];
      mockPrismaService.agent.findMany.mockResolvedValue(agents);

      const result = await service.findAll(MOCK_USER_ID);

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        include: {
          provider: { select: { id: true, name: true, protocol: true } },
          _count: {
            select: { skills: true, mcpServers: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { version: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0]._count.skills).toBe(2);
      expect(result[0]._count.mcpServers).toBe(1);
      expect(result[0].latestVersion).toBe(3);
    });

    it('with status filter should only return matching agents', async () => {
      const agents = [
        {
          ...mockAgent,
          status: AgentStatus.ARCHIVED,
          provider: {
            id: MOCK_PROVIDER_ID,
            name: 'OpenAI',
            protocol: 'OPENAI',
          },
          _count: { skills: 0, mcpServers: 0 },
          versions: [],
        },
      ];
      mockPrismaService.agent.findMany.mockResolvedValue(agents);

      const result = await service.findAll(MOCK_USER_ID, AgentStatus.ARCHIVED);

      expect(mockPrismaService.agent.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID, status: AgentStatus.ARCHIVED },
        include: {
          provider: { select: { id: true, name: true, protocol: true } },
          _count: {
            select: { skills: true, mcpServers: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { version: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe(AgentStatus.ARCHIVED);
      expect(result[0].latestVersion).toBeNull();
    });
  });

  describe('findOne', () => {
    it('should return agent with relations and latestVersion', async () => {
      const agentWithRelations = {
        ...mockAgent,
        provider: { id: MOCK_PROVIDER_ID, name: 'OpenAI', protocol: 'OPENAI' },
        skills: [
          {
            id: 'as-1',
            agentId: MOCK_AGENT_ID,
            skillId: MOCK_SKILL_ID,
            priority: 1,
            skill: { id: MOCK_SKILL_ID, name: 'Web Search' },
          },
        ],
        mcpServers: [
          {
            id: 'am-1',
            agentId: MOCK_AGENT_ID,
            mcpServerId: MOCK_MCP_SERVER_ID,
            enabledTools: ['tool1'],
            mcpServer: { id: MOCK_MCP_SERVER_ID, name: 'Browser MCP' },
          },
        ],
        versions: [{ version: 2 }],
      };
      mockPrismaService.agent.findFirst.mockResolvedValue(agentWithRelations);

      const result = await service.findOne(MOCK_AGENT_ID, MOCK_USER_ID);

      expect(mockPrismaService.agent.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID, userId: MOCK_USER_ID },
        include: {
          provider: { select: { id: true, name: true, protocol: true } },
          skills: {
            include: { skill: true },
            orderBy: { priority: 'desc' },
          },
          mcpServers: {
            include: { mcpServer: true },
          },
          versions: {
            orderBy: { version: 'desc' },
            take: 1,
            select: { version: true },
          },
        },
      });
      expect(result.skills).toHaveLength(1);
      expect(result.mcpServers).toHaveLength(1);
      expect(result.latestVersion).toBe(2);
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update agent fields', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const updatedAgent = {
        ...mockAgent,
        name: 'Updated Agent',
      };
      mockPrismaService.agent.update.mockResolvedValue(updatedAgent);

      const result = await service.update(MOCK_AGENT_ID, MOCK_USER_ID, {
        name: 'Updated Agent',
      });

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID },
        data: { name: 'Updated Agent' },
      });
      expect(result.name).toBe('Updated Agent');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', MOCK_USER_ID, { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate provider ownership when changing provider', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.update(MOCK_AGENT_ID, MOCK_USER_ID, {
          providerId: 'invalid-provider',
        })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('archive', () => {
    it('should set status to ARCHIVED', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const archivedAgent = {
        ...mockAgent,
        status: AgentStatus.ARCHIVED,
      };
      mockPrismaService.agent.update.mockResolvedValue(archivedAgent);

      const result = await service.archive(MOCK_AGENT_ID, MOCK_USER_ID);

      expect(mockPrismaService.agent.update).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID },
        data: {
          status: AgentStatus.ARCHIVED,
        },
      });
      expect(result.status).toBe(AgentStatus.ARCHIVED);
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.archive('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete agent', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agent.delete.mockResolvedValue(mockAgent);

      const result = await service.remove(MOCK_AGENT_ID, MOCK_USER_ID);

      expect(mockPrismaService.agent.delete).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID },
      });
      expect(result).toEqual({ message: 'Agent deleted successfully' });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addSkill', () => {
    it('should create agent-skill association', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const agentSkill = {
        id: 'as-1',
        agentId: MOCK_AGENT_ID,
        skillId: MOCK_SKILL_ID,
        priority: 5,
        skill: { id: MOCK_SKILL_ID, name: 'Web Search' },
      };
      mockPrismaService.agentSkill.create.mockResolvedValue(agentSkill);

      const result = await service.addSkill(
        MOCK_AGENT_ID,
        MOCK_USER_ID,
        MOCK_SKILL_ID,
        5
      );

      expect(mockPrismaService.agent.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID, userId: MOCK_USER_ID },
      });
      expect(mockPrismaService.agentSkill.create).toHaveBeenCalledWith({
        data: {
          agentId: MOCK_AGENT_ID,
          skillId: MOCK_SKILL_ID,
          priority: 5,
        },
        include: { skill: true },
      });
      expect(result.skillId).toBe(MOCK_SKILL_ID);
      expect(result.priority).toBe(5);
    });

    it('should use default priority of 0 when not provided', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentSkill.create.mockResolvedValue({
        id: 'as-1',
        agentId: MOCK_AGENT_ID,
        skillId: MOCK_SKILL_ID,
        priority: 0,
        skill: { id: MOCK_SKILL_ID, name: 'Web Search' },
      });

      await service.addSkill(MOCK_AGENT_ID, MOCK_USER_ID, MOCK_SKILL_ID);

      expect(mockPrismaService.agentSkill.create).toHaveBeenCalledWith({
        data: {
          agentId: MOCK_AGENT_ID,
          skillId: MOCK_SKILL_ID,
          priority: 0,
        },
        include: { skill: true },
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.addSkill('nonexistent-id', MOCK_USER_ID, MOCK_SKILL_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeSkill', () => {
    it('should remove agent-skill association', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const agentSkill = {
        id: 'as-1',
        agentId: MOCK_AGENT_ID,
        skillId: MOCK_SKILL_ID,
        priority: 0,
      };
      mockPrismaService.agentSkill.findFirst.mockResolvedValue(agentSkill);
      mockPrismaService.agentSkill.delete.mockResolvedValue(agentSkill);

      const result = await service.removeSkill(
        MOCK_AGENT_ID,
        MOCK_USER_ID,
        MOCK_SKILL_ID
      );

      expect(mockPrismaService.agentSkill.findFirst).toHaveBeenCalledWith({
        where: { agentId: MOCK_AGENT_ID, skillId: MOCK_SKILL_ID },
      });
      expect(mockPrismaService.agentSkill.delete).toHaveBeenCalledWith({
        where: { id: 'as-1' },
      });
      expect(result).toEqual({
        message: 'Skill removed from agent successfully',
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.removeSkill('nonexistent-id', MOCK_USER_ID, MOCK_SKILL_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when agent-skill association not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentSkill.findFirst.mockResolvedValue(null);

      await expect(
        service.removeSkill(MOCK_AGENT_ID, MOCK_USER_ID, 'nonexistent-skill')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('addMcpServer', () => {
    it('should create agent-mcp association', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const agentMcp = {
        id: 'am-1',
        agentId: MOCK_AGENT_ID,
        mcpServerId: MOCK_MCP_SERVER_ID,
        enabledTools: ['tool1', 'tool2'],
        mcpServer: { id: MOCK_MCP_SERVER_ID, name: 'Browser MCP' },
      };
      mockPrismaService.agentMcp.create.mockResolvedValue(agentMcp);

      const result = await service.addMcpServer(
        MOCK_AGENT_ID,
        MOCK_USER_ID,
        MOCK_MCP_SERVER_ID,
        ['tool1', 'tool2']
      );

      expect(mockPrismaService.agent.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID, userId: MOCK_USER_ID },
      });
      expect(mockPrismaService.agentMcp.create).toHaveBeenCalledWith({
        data: {
          agentId: MOCK_AGENT_ID,
          mcpServerId: MOCK_MCP_SERVER_ID,
          enabledTools: ['tool1', 'tool2'],
        },
        include: { mcpServer: true },
      });
      expect(result.mcpServerId).toBe(MOCK_MCP_SERVER_ID);
      expect(result.enabledTools).toEqual(['tool1', 'tool2']);
    });

    it('should use empty enabledTools when not provided', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentMcp.create.mockResolvedValue({
        id: 'am-1',
        agentId: MOCK_AGENT_ID,
        mcpServerId: MOCK_MCP_SERVER_ID,
        enabledTools: [],
        mcpServer: { id: MOCK_MCP_SERVER_ID, name: 'Browser MCP' },
      });

      await service.addMcpServer(
        MOCK_AGENT_ID,
        MOCK_USER_ID,
        MOCK_MCP_SERVER_ID
      );

      expect(mockPrismaService.agentMcp.create).toHaveBeenCalledWith({
        data: {
          agentId: MOCK_AGENT_ID,
          mcpServerId: MOCK_MCP_SERVER_ID,
          enabledTools: [],
        },
        include: { mcpServer: true },
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.addMcpServer('nonexistent-id', MOCK_USER_ID, MOCK_MCP_SERVER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeMcpServer', () => {
    it('should remove agent-mcp association', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const agentMcp = {
        id: 'am-1',
        agentId: MOCK_AGENT_ID,
        mcpServerId: MOCK_MCP_SERVER_ID,
        enabledTools: [],
      };
      mockPrismaService.agentMcp.findFirst.mockResolvedValue(agentMcp);
      mockPrismaService.agentMcp.delete.mockResolvedValue(agentMcp);

      const result = await service.removeMcpServer(
        MOCK_AGENT_ID,
        MOCK_USER_ID,
        MOCK_MCP_SERVER_ID
      );

      expect(mockPrismaService.agentMcp.findFirst).toHaveBeenCalledWith({
        where: { agentId: MOCK_AGENT_ID, mcpServerId: MOCK_MCP_SERVER_ID },
      });
      expect(mockPrismaService.agentMcp.delete).toHaveBeenCalledWith({
        where: { id: 'am-1' },
      });
      expect(result).toEqual({
        message: 'MCP server removed from agent successfully',
      });
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMcpServer(
          'nonexistent-id',
          MOCK_USER_ID,
          MOCK_MCP_SERVER_ID
        )
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when agent-mcp association not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.agentMcp.findFirst.mockResolvedValue(null);

      await expect(
        service.removeMcpServer(MOCK_AGENT_ID, MOCK_USER_ID, 'nonexistent-mcp')
      ).rejects.toThrow(NotFoundException);
    });
  });
});
