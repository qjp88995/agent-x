import { ConflictException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import * as aiProviderUtil from '../../common/ai-provider.util';
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
  maskApiKey: jest.fn(),
}));

jest.mock('../../common/ai-provider.util', () => ({
  testConnection: jest.fn(),
  resolveModels: jest.fn(),
}));

jest.mock('../../common/pick-defined.util', () => ({
  pickDefined: jest.fn((obj: Record<string, unknown>) =>
    Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

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
      (cryptoUtil.maskApiKey as jest.Mock).mockReturnValue('sk-...1234');

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
      (cryptoUtil.maskApiKey as jest.Mock).mockReturnValue('sk-...5678');

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

  describe('testProviderConnection', () => {
    it('should delegate to shared testConnection utility', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-real-api-key');
      (aiProviderUtil.testConnection as jest.Mock).mockResolvedValue({
        success: true,
        message: 'Connection successful',
      });

      const result = await service.testProviderConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(cryptoUtil.decrypt).toHaveBeenCalledWith(
        'encrypted-api-key',
        ENCRYPTION_SECRET
      );
      expect(aiProviderUtil.testConnection).toHaveBeenCalledWith(
        'OPENAI',
        'https://api.openai.com/v1',
        'sk-real-api-key'
      );
      expect(result).toEqual({
        success: true,
        message: 'Connection successful',
      });
    });

    it('should return failure when connection fails', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(mockProvider);
      (cryptoUtil.decrypt as jest.Mock).mockReturnValue('sk-invalid-key');
      (aiProviderUtil.testConnection as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Connection failed: Invalid API key',
      });

      const result = await service.testProviderConnection(
        MOCK_PROVIDER_ID,
        MOCK_USER_ID
      );

      expect(result).toEqual({
        success: false,
        message: 'Connection failed: Invalid API key',
      });
    });

    it('should throw NotFoundException when provider not found', async () => {
      mockPrismaService.provider.findFirst.mockResolvedValue(null);

      await expect(
        service.testProviderConnection('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
