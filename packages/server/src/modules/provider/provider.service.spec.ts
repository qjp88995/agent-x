import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as cryptoUtil from '../../common/crypto.util';
import { ProviderProtocol } from '../../generated/prisma/client';
import { ProviderService } from './provider.service';

jest.mock('../../generated/prisma/client', () => ({
  ProviderProtocol: {
    OPENAI: 'OPENAI',
    ANTHROPIC: 'ANTHROPIC',
    GEMINI: 'GEMINI',
    DEEPSEEK: 'DEEPSEEK',
    QWEN: 'QWEN',
    ZHIPU: 'ZHIPU',
    MOONSHOT: 'MOONSHOT',
  },
}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

jest.mock('../../common/crypto.util', () => ({
  encrypt: jest.fn(),
  decrypt: jest.fn(),
}));

jest.mock('ai', () => ({
  generateText: jest.fn(),
  APICallError: {
    isInstance: jest.fn((error: unknown) => {
      return error instanceof Error && 'statusCode' in error && 'url' in error;
    }),
  },
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(),
}));

jest.mock('@ai-sdk/anthropic', () => ({
  createAnthropic: jest.fn(),
}));

jest.mock('@ai-sdk/google', () => ({
  createGoogleGenerativeAI: jest.fn(),
}));

jest.mock('@ai-sdk/deepseek', () => ({
  createDeepSeek: jest.fn(),
}));

jest.mock('@ai-sdk/alibaba', () => ({
  createAlibaba: jest.fn(),
}));

jest.mock('@ai-sdk/moonshotai', () => ({
  createMoonshotAI: jest.fn(),
}));

jest.mock('zhipu-ai-provider', () => ({
  createZhipu: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { generateText } = require('ai');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createOpenAI } = require('@ai-sdk/openai');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAnthropic } = require('@ai-sdk/anthropic');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createGoogleGenerativeAI } = require('@ai-sdk/google');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createDeepSeek } = require('@ai-sdk/deepseek');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createAlibaba } = require('@ai-sdk/alibaba');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createMoonshotAI } = require('@ai-sdk/moonshotai');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { createZhipu } = require('zhipu-ai-provider');

const ENCRYPTION_SECRET = 'test-encryption-secret';
const MOCK_USER_ID = 'cuid-user-1';
const MOCK_PROVIDER_ID = 'cuid-provider-1';

const mockProvider = {
  id: MOCK_PROVIDER_ID,
  userId: MOCK_USER_ID,
  name: 'OpenAI Production',
  protocol: ProviderProtocol.OPENAI,
  baseUrl: 'https://api.openai.com/v1',
  apiKey: 'encrypted-api-key',
  isActive: true,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  provider: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  providerModel: {
    upsert: jest.fn(),
  },
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      ENCRYPTION_SECRET,
    };
    return config[key];
  }),
};

describe('ProviderService', () => {
  let service: ProviderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProviderService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<ProviderService>(ProviderService);

    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config: Record<string, string> = {
        ENCRYPTION_SECRET,
      };
      return config[key];
    });
  });

  describe('create', () => {
    it('should create provider with encrypted API key', async () => {
      (cryptoUtil.encrypt as jest.Mock).mockReturnValue('encrypted-api-key');
      mockPrismaService.provider.create.mockResolvedValue(mockProvider);

      const dto = {
        name: 'OpenAI Production',
        protocol: ProviderProtocol.OPENAI,
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'sk-test-key-1234',
      };

      const result = await service.create(MOCK_USER_ID, dto);

      expect(cryptoUtil.encrypt).toHaveBeenCalledWith(
        'sk-test-key-1234',
        ENCRYPTION_SECRET
      );
      expect(mockPrismaService.provider.create).toHaveBeenCalledWith({
        data: {
          userId: MOCK_USER_ID,
          name: dto.name,
          protocol: dto.protocol,
          baseUrl: dto.baseUrl,
          apiKey: 'encrypted-api-key',
        },
      });
      expect(result).toEqual(mockProvider);
    });
  });

  describe('findAll', () => {
    it('should return providers with masked API keys', async () => {
      const providers = [
        {
          ...mockProvider,
          _count: { models: 3 },
        },
      ];
      mockPrismaService.provider.findMany.mockResolvedValue(providers);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-test-key-1234');

      const result = await service.findAll(MOCK_USER_ID);

      expect(mockPrismaService.provider.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        include: {
          models: true,
          _count: {
            select: { models: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].apiKey).toBe('sk-...1234');
      expect(result[0]._count.models).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a single provider with masked API key', async () => {
      const provider = {
        ...mockProvider,
        models: [],
        _count: { models: 0 },
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(provider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-test-key-5678');

      const result = await service.findOne(MOCK_PROVIDER_ID, MOCK_USER_ID);

      expect(mockPrismaService.provider.findFirst).toHaveBeenCalledWith({
        where: { id: MOCK_PROVIDER_ID, userId: MOCK_USER_ID },
        include: {
          models: true,
          _count: {
            select: { models: true },
          },
        },
      });
      expect(result.apiKey).toBe('sk-...5678');
    });

    it('should throw NotFoundException when provider not found', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.findOne('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update provider fields', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      const updatedProvider = { ...mockProvider, name: 'Updated Name' };
      mockPrismaService.provider.update.mockResolvedValue(updatedProvider);

      const result = await service.update(MOCK_PROVIDER_ID, MOCK_USER_ID, {
        name: 'Updated Name',
      });

      expect(mockPrismaService.provider.update).toHaveBeenCalledWith({
        where: { id: MOCK_PROVIDER_ID },
        data: { name: 'Updated Name' },
      });
      expect(result.name).toBe('Updated Name');
    });

    it('should re-encrypt API key when provided', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.encrypt as jest.Mock).mockReturnValue('new-encrypted-key');
      mockPrismaService.provider.update.mockResolvedValue({
        ...mockProvider,
        apiKey: 'new-encrypted-key',
      });

      await service.update(MOCK_PROVIDER_ID, MOCK_USER_ID, {
        apiKey: 'sk-new-api-key',
      });

      expect(cryptoUtil.encrypt).toHaveBeenCalledWith(
        'sk-new-api-key',
        ENCRYPTION_SECRET
      );
      expect(mockPrismaService.provider.update).toHaveBeenCalledWith({
        where: { id: MOCK_PROVIDER_ID },
        data: { apiKey: 'new-encrypted-key' },
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', MOCK_USER_ID, { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete provider when no agents are using it', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue({
        ...mockProvider,
        _count: { agents: 0 },
      });
      mockPrismaService.provider.delete.mockResolvedValue(mockProvider);

      const result = await service.remove(MOCK_PROVIDER_ID, MOCK_USER_ID);

      expect(mockPrismaService.provider.delete).toHaveBeenCalledWith({
        where: { id: MOCK_PROVIDER_ID },
      });
      expect(result).toEqual({ message: 'Provider deleted successfully' });
    });

    it('should throw ConflictException when agents are using the provider', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue({
        ...mockProvider,
        _count: { agents: 2 },
      });

      await expect(
        service.remove(MOCK_PROVIDER_ID, MOCK_USER_ID)
      ).rejects.toThrow(ConflictException);

      expect(mockPrismaService.provider.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when provider not found', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('testConnection', () => {
    it('should return success for valid OPENAI provider', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-real-api-key');

      const mockChat = jest.fn().mockReturnValue('openai-model-instance');
      const mockOpenAI = Object.assign(jest.fn(), { chat: mockChat });
      (createOpenAI as jest.Mock).mockReturnValue(mockOpenAI);
      (generateText as jest.Mock).mockResolvedValue({
        text: 'Hello',
      });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(cryptoUtil.decrypt).toHaveBeenCalledWith(
        'encrypted-api-key',
        ENCRYPTION_SECRET
      );
      expect(createOpenAI).toHaveBeenCalledWith({
        baseURL: mockProvider.baseUrl,
        apiKey: 'sk-real-api-key',
      });
      expect(mockChat).toHaveBeenCalledWith('gpt-4o-mini');
      expect(generateText).toHaveBeenCalledWith({
        model: 'openai-model-instance',
        prompt: 'Say hello in one word.',
        maxOutputTokens: 10,
      });
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return success for valid ANTHROPIC provider', async () => {
      const anthropicProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.ANTHROPIC,
        baseUrl: 'https://api.anthropic.com',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(anthropicProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-ant-key');

      const mockModel = jest.fn();
      (createAnthropic as jest.Mock).mockReturnValue(mockModel);
      mockModel.mockReturnValue('anthropic-model-instance');
      (generateText as jest.Mock).mockResolvedValue({
        text: 'Hello',
      });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createAnthropic).toHaveBeenCalledWith({
        baseURL: 'https://api.anthropic.com',
        apiKey: 'sk-ant-key',
      });
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return success for valid GEMINI provider', async () => {
      const geminiProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.GEMINI,
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(geminiProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('google-api-key');

      const mockModel = jest.fn();
      (createGoogleGenerativeAI as jest.Mock).mockReturnValue(mockModel);
      mockModel.mockReturnValue('gemini-model-instance');
      (generateText as jest.Mock).mockResolvedValue({
        text: 'Hello',
      });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createGoogleGenerativeAI).toHaveBeenCalledWith({
        baseURL: 'https://generativelanguage.googleapis.com/v1beta',
        apiKey: 'google-api-key',
      });
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return failure when connection fails', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-invalid-key');

      const mockChat = jest.fn().mockReturnValue('openai-model-instance');
      const mockOpenAI = Object.assign(jest.fn(), { chat: mockChat });
      (createOpenAI as jest.Mock).mockReturnValue(mockOpenAI);
      (generateText as jest.Mock).mockRejectedValue(
        new Error('Invalid API key')
      );

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(result).toEqual({
        success: false,
        message: 'Connection failed: Invalid API key',
      });
    });

    it('should return failure with status code for APICallError', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-invalid-key');

      const mockChat = jest.fn().mockReturnValue('openai-model-instance');
      const mockOpenAI = Object.assign(jest.fn(), { chat: mockChat });
      (createOpenAI as jest.Mock).mockReturnValue(mockOpenAI);

      const apiError = Object.assign(new Error('Unauthorized'), {
        statusCode: 401,
        url: 'https://api.openai.com/v1/chat/completions',
      });
      (generateText as jest.Mock).mockRejectedValue(apiError);

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(result).toEqual({
        success: false,
        message: 'Connection failed (401): Unauthorized',
      });
    });

    it('should return success for valid DEEPSEEK provider', async () => {
      const deepseekProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.DEEPSEEK,
        baseUrl: 'https://api.deepseek.com',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(deepseekProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-deepseek-key');

      const mockModel = jest.fn().mockReturnValue('deepseek-model-instance');
      (createDeepSeek as jest.Mock).mockReturnValue(mockModel);
      (generateText as jest.Mock).mockResolvedValue({ text: 'Hello' });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createDeepSeek).toHaveBeenCalledWith({
        baseURL: 'https://api.deepseek.com',
        apiKey: 'sk-deepseek-key',
      });
      expect(mockModel).toHaveBeenCalledWith('deepseek-chat');
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return success for valid QWEN provider', async () => {
      const qwenProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.QWEN,
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(qwenProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-qwen-key');

      const mockModel = jest.fn().mockReturnValue('qwen-model-instance');
      (createAlibaba as jest.Mock).mockReturnValue(mockModel);
      (generateText as jest.Mock).mockResolvedValue({ text: 'Hello' });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createAlibaba).toHaveBeenCalledWith({
        baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey: 'sk-qwen-key',
      });
      expect(mockModel).toHaveBeenCalledWith('qwen-turbo');
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return success for valid ZHIPU provider', async () => {
      const zhipuProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.ZHIPU,
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(zhipuProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-zhipu-key');

      const mockModel = jest.fn().mockReturnValue('zhipu-model-instance');
      (createZhipu as jest.Mock).mockReturnValue(mockModel);
      (generateText as jest.Mock).mockResolvedValue({ text: 'Hello' });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createZhipu).toHaveBeenCalledWith({
        baseURL: 'https://open.bigmodel.cn/api/paas/v4',
        apiKey: 'sk-zhipu-key',
      });
      expect(mockModel).toHaveBeenCalledWith('glm-4-flash');
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return success for valid MOONSHOT provider', async () => {
      const moonshotProvider = {
        ...mockProvider,
        protocol: ProviderProtocol.MOONSHOT,
        baseUrl: 'https://api.moonshot.cn/v1',
      };
      mockPrismaService.provider.findFirst.mockResolvedValue(moonshotProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-moonshot-key');

      const mockModel = jest.fn().mockReturnValue('moonshot-model-instance');
      (createMoonshotAI as jest.Mock).mockReturnValue(mockModel);
      (generateText as jest.Mock).mockResolvedValue({ text: 'Hello' });

      const result = await service.testConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(createMoonshotAI).toHaveBeenCalledWith({
        baseURL: 'https://api.moonshot.cn/v1',
        apiKey: 'sk-moonshot-key',
      });
      expect(mockModel).toHaveBeenCalledWith('moonshot-v1-8k');
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.testConnection('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
