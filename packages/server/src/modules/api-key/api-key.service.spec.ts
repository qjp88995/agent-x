import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { createHash } from 'crypto';

import { ApiKeyService } from './api-key.service';

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const MOCK_USER_ID = 'cuid-user-1';
const MOCK_KEY_ID = 'cuid-key-1';
const MOCK_AGENT_ID = 'cuid-agent-1';

function hashKey(rawKey: string): string {
  return createHash('sha256').update(rawKey).digest('hex');
}

const mockPrismaService = {
  apiKey: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

describe('ApiKeyService', () => {
  let service: ApiKeyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApiKeyService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ApiKeyService>(ApiKeyService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should generate key and store hash', async () => {
      const mockRecord = {
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        name: 'Test Key',
        key: 'hashed-value',
        agentId: null,
        expiresAt: null,
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date('2026-01-01'),
        agent: null,
      };

      mockPrismaService.apiKey.create.mockResolvedValue(mockRecord);

      const result = await service.create(MOCK_USER_ID, {
        name: 'Test Key',
      });

      expect(result.plainKey).toBeDefined();
      expect(result.plainKey).toMatch(/^sk-agx-[a-f0-9]{64}$/);

      const createCall = mockPrismaService.apiKey.create.mock.calls[0][0];
      expect(createCall.data.userId).toBe(MOCK_USER_ID);
      expect(createCall.data.name).toBe('Test Key');
      expect(createCall.data.key).not.toBe(result.plainKey);
      expect(createCall.data.key).toBe(hashKey(result.plainKey));
    });

    it('should store agentId and expiresAt when provided', async () => {
      const expiresAt = '2027-01-01T00:00:00.000Z';
      const mockRecord = {
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        name: 'Agent Key',
        key: 'hashed-value',
        agentId: MOCK_AGENT_ID,
        expiresAt: new Date(expiresAt),
        isActive: true,
        lastUsedAt: null,
        createdAt: new Date('2026-01-01'),
        agent: { id: MOCK_AGENT_ID, name: 'Test Agent' },
      };

      mockPrismaService.apiKey.create.mockResolvedValue(mockRecord);

      const result = await service.create(MOCK_USER_ID, {
        name: 'Agent Key',
        agentId: MOCK_AGENT_ID,
        expiresAt,
      });

      const createCall = mockPrismaService.apiKey.create.mock.calls[0][0];
      expect(createCall.data.agentId).toBe(MOCK_AGENT_ID);
      expect(createCall.data.expiresAt).toEqual(new Date(expiresAt));
      expect(result.id).toBe(MOCK_KEY_ID);
    });
  });

  describe('findAll', () => {
    it('should return masked keys', async () => {
      const hashedKey =
        'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';
      const mockKeys = [
        {
          id: MOCK_KEY_ID,
          userId: MOCK_USER_ID,
          name: 'My Key',
          key: hashedKey,
          agentId: null,
          expiresAt: null,
          isActive: true,
          lastUsedAt: null,
          createdAt: new Date('2026-01-01'),
          agent: null,
        },
      ];

      mockPrismaService.apiKey.findMany.mockResolvedValue(mockKeys);

      const result = await service.findAll(MOCK_USER_ID);

      expect(result).toHaveLength(1);
      expect(result[0].key).toBe('a1b2c3d4...a1b2');
      expect(result[0].key).not.toBe(hashedKey);

      expect(mockPrismaService.apiKey.findMany).toHaveBeenCalledWith({
        where: { userId: MOCK_USER_ID },
        include: {
          agent: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('remove', () => {
    it('should deactivate key when owned by user', async () => {
      const mockKey = {
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        isActive: true,
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrismaService.apiKey.update.mockResolvedValue({
        ...mockKey,
        isActive: false,
      });

      const result = await service.remove(MOCK_KEY_ID, MOCK_USER_ID);

      expect(mockPrismaService.apiKey.update).toHaveBeenCalledWith({
        where: { id: MOCK_KEY_ID },
        data: { isActive: false },
      });
      expect(result).toEqual({ message: 'API key deactivated successfully' });
    });

    it('should throw NotFoundException when key not found', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when user does not own key', async () => {
      const mockKey = {
        id: MOCK_KEY_ID,
        userId: 'other-user-id',
        isActive: true,
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);

      await expect(service.remove(MOCK_KEY_ID, MOCK_USER_ID)).rejects.toThrow(
        NotFoundException
      );

      expect(mockPrismaService.apiKey.update).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('should match hash and return user data', async () => {
      const rawKey = 'sk-agx-abc123';
      const hashed = hashKey(rawKey);

      const mockKey = {
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        agentId: MOCK_AGENT_ID,
        key: hashed,
        isActive: true,
        expiresAt: null,
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrismaService.apiKey.update.mockResolvedValue(mockKey);

      const result = await service.validate(rawKey);

      expect(mockPrismaService.apiKey.findUnique).toHaveBeenCalledWith({
        where: { key: hashed },
      });
      expect(result).toEqual({
        userId: MOCK_USER_ID,
        agentId: MOCK_AGENT_ID,
      });
      expect(mockPrismaService.apiKey.update).toHaveBeenCalledWith({
        where: { id: MOCK_KEY_ID },
        data: { lastUsedAt: expect.any(Date) },
      });
    });

    it('should return null for non-existent key', async () => {
      mockPrismaService.apiKey.findUnique.mockResolvedValue(null);

      const result = await service.validate('sk-agx-nonexistent');

      expect(result).toBeNull();
    });

    it('should return null for inactive key', async () => {
      const rawKey = 'sk-agx-inactive';
      const hashed = hashKey(rawKey);

      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        agentId: null,
        key: hashed,
        isActive: false,
        expiresAt: null,
      });

      const result = await service.validate(rawKey);

      expect(result).toBeNull();
      expect(mockPrismaService.apiKey.update).not.toHaveBeenCalled();
    });

    it('should return null for expired key', async () => {
      const rawKey = 'sk-agx-expired';
      const hashed = hashKey(rawKey);

      mockPrismaService.apiKey.findUnique.mockResolvedValue({
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        agentId: null,
        key: hashed,
        isActive: true,
        expiresAt: new Date('2020-01-01'),
      });

      const result = await service.validate(rawKey);

      expect(result).toBeNull();
      expect(mockPrismaService.apiKey.update).not.toHaveBeenCalled();
    });

    it('should return data for key with future expiry', async () => {
      const rawKey = 'sk-agx-future';
      const hashed = hashKey(rawKey);

      const mockKey = {
        id: MOCK_KEY_ID,
        userId: MOCK_USER_ID,
        agentId: null,
        key: hashed,
        isActive: true,
        expiresAt: new Date('2099-01-01'),
      };

      mockPrismaService.apiKey.findUnique.mockResolvedValue(mockKey);
      mockPrismaService.apiKey.update.mockResolvedValue(mockKey);

      const result = await service.validate(rawKey);

      expect(result).toEqual({
        userId: MOCK_USER_ID,
        agentId: null,
      });
    });
  });
});
