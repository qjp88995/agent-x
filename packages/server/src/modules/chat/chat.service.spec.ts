import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { AgentStatus, MessageRole } from '../../generated/prisma/client';
import { ChatService } from './chat.service';

jest.mock('../../generated/prisma/client', () => ({
  AgentStatus: {
    ACTIVE: 'ACTIVE',
    ARCHIVED: 'ARCHIVED',
  },
  MessageRole: {
    USER: 'USER',
    ASSISTANT: 'ASSISTANT',
    SYSTEM: 'SYSTEM',
    TOOL: 'TOOL',
  },
}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const MOCK_USER_ID = 'cuid-user-1';
const MOCK_AGENT_ID = 'cuid-agent-1';
const MOCK_CONVERSATION_ID = 'cuid-conv-1';

const mockAgent = {
  id: MOCK_AGENT_ID,
  userId: MOCK_USER_ID,
  name: 'Test Agent',
  status: AgentStatus.ACTIVE,
  avatar: null,
};

const mockConversation = {
  id: MOCK_CONVERSATION_ID,
  userId: MOCK_USER_ID,
  agentId: MOCK_AGENT_ID,
  title: 'New Chat',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  agent: { id: MOCK_AGENT_ID, name: 'Test Agent', avatar: null },
};

const mockMessage = {
  id: 'cuid-msg-1',
  conversationId: MOCK_CONVERSATION_ID,
  role: MessageRole.USER,
  parts: [{ type: 'text', text: 'Hello' }],
  metadata: null,
  tokenUsage: null,
  createdAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  agent: {
    findFirst: jest.fn(),
  },
  conversation: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    delete: jest.fn(),
    update: jest.fn(),
  },
  message: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('ChatService', () => {
  let service: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);

    jest.clearAllMocks();
  });

  describe('createConversation', () => {
    it('should create conversation for agent', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      mockPrismaService.conversation.create.mockResolvedValue(mockConversation);

      const result = await service.createConversation(
        MOCK_USER_ID,
        MOCK_AGENT_ID
      );

      expect(mockPrismaService.agent.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_AGENT_ID, deletedAt: null },
      });
      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          agentId: MOCK_AGENT_ID,
          title: 'New Chat',
        },
        include: {
          agent: { select: { id: true, name: true, avatar: true } },
        },
      });
      expect(result).toEqual(mockConversation);
    });

    it('should create conversation with custom title', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(mockAgent);
      const conversationWithTitle = {
        ...mockConversation,
        title: 'My Custom Chat',
      };
      mockPrismaService.conversation.create.mockResolvedValue(
        conversationWithTitle
      );

      const result = await service.createConversation(
        MOCK_USER_ID,
        MOCK_AGENT_ID,
        'My Custom Chat'
      );

      expect(mockPrismaService.conversation.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          agentId: MOCK_AGENT_ID,
          title: 'My Custom Chat',
        },
        include: {
          agent: { select: { id: true, name: true, avatar: true } },
        },
      });
      expect(result.title).toBe('My Custom Chat');
    });

    it('should throw NotFoundException when agent not found', async () => {
      mockPrismaService.agent.findFirst.mockResolvedValue(null);

      await expect(
        service.createConversation(MOCK_USER_ID, 'nonexistent-id')
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.conversation.create).not.toHaveBeenCalled();
    });
  });

  describe('getConversations', () => {
    it('should return user conversations ordered by updatedAt desc', async () => {
      const conversations = [mockConversation];
      mockPrismaService.conversation.findMany.mockResolvedValue(conversations);

      const result = await service.getConversations(MOCK_USER_ID);

      expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        include: {
          agent: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(MOCK_CONVERSATION_ID);
    });
  });

  describe('getMessages', () => {
    it('should return ordered messages for a conversation', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation
      );
      const messages = [
        mockMessage,
        {
          ...mockMessage,
          id: 'cuid-msg-2',
          role: MessageRole.ASSISTANT,
          parts: [{ type: 'text', text: 'Hi there!' }],
          createdAt: new Date('2026-01-02'),
        },
      ];
      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessages(
        MOCK_CONVERSATION_ID,
        MOCK_USER_ID
      );

      expect(mockPrismaService.conversation.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_CONVERSATION_ID, userId: MOCK_USER_ID },
        include: {
          agent: { select: { id: true, name: true, avatar: true } },
        },
      });
      expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
        where: { conversationId: MOCK_CONVERSATION_ID },
        orderBy: { createdAt: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should throw NotFoundException for unauthorized conversation', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.getMessages(MOCK_CONVERSATION_ID, 'other-user-id')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveMessage', () => {
    it('should create message and update conversation timestamp', async () => {
      mockPrismaService.message.create.mockResolvedValue(mockMessage);
      mockPrismaService.conversation.update.mockResolvedValue(mockConversation);

      const result = await service.saveMessage(
        MOCK_CONVERSATION_ID,
        MessageRole.USER,
        [{ type: 'text', text: 'Hello' }]
      );

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: MOCK_CONVERSATION_ID,
          role: MessageRole.USER,
          parts: [{ type: 'text', text: 'Hello' }],
          tokenUsage: undefined,
        },
      });
      expect(mockPrismaService.conversation.update).toHaveBeenCalledWith({
        where: { id: MOCK_CONVERSATION_ID },
        data: { updatedAt: expect.any(Date) },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should save message with token usage', async () => {
      const tokenUsage = { promptTokens: 10, completionTokens: 20 };
      const messageWithUsage = { ...mockMessage, tokenUsage };
      mockPrismaService.message.create.mockResolvedValue(messageWithUsage);
      mockPrismaService.conversation.update.mockResolvedValue(mockConversation);

      const result = await service.saveMessage(
        MOCK_CONVERSATION_ID,
        MessageRole.ASSISTANT,
        [{ type: 'text', text: 'Response' }],
        tokenUsage
      );

      expect(mockPrismaService.message.create).toHaveBeenCalledWith({
        data: {
          conversationId: MOCK_CONVERSATION_ID,
          role: MessageRole.ASSISTANT,
          parts: [{ type: 'text', text: 'Response' }],
          tokenUsage,
        },
      });
      expect(result.tokenUsage).toEqual(tokenUsage);
    });
  });

  describe('getMessagesForAI', () => {
    it('should return messages in AI SDK format', async () => {
      const messages = [
        {
          ...mockMessage,
          role: MessageRole.USER,
          parts: [{ type: 'text', text: 'Hello' }],
        },
        {
          ...mockMessage,
          id: 'cuid-msg-2',
          role: MessageRole.ASSISTANT,
          parts: [{ type: 'text', text: 'Hi there!' }],
        },
      ];
      mockPrismaService.message.findMany.mockResolvedValue(messages);

      const result = await service.getMessagesForAI(MOCK_CONVERSATION_ID);

      expect(result).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ]);
    });
  });

  describe('deleteConversation', () => {
    it('should delete conversation owned by user', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(
        mockConversation
      );
      mockPrismaService.conversation.delete.mockResolvedValue(mockConversation);

      const result = await service.deleteConversation(
        MOCK_CONVERSATION_ID,
        MOCK_USER_ID
      );

      expect(mockPrismaService.conversation.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_CONVERSATION_ID, userId: MOCK_USER_ID },
        include: {
          agent: { select: { id: true, name: true, avatar: true } },
        },
      });
      expect(mockPrismaService.conversation.delete).toHaveBeenCalledWith({
        where: { id: MOCK_CONVERSATION_ID },
      });
      expect(result).toEqual({
        message: 'Conversation deleted successfully',
      });
    });

    it('should throw NotFoundException for unauthorized delete', async () => {
      mockPrismaService.conversation.findFirst.mockResolvedValue(null);

      await expect(
        service.deleteConversation(MOCK_CONVERSATION_ID, 'other-user-id')
      ).rejects.toThrow(NotFoundException);

      expect(mockPrismaService.conversation.delete).not.toHaveBeenCalled();
    });
  });
});
