import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SkillService } from './skill.service';
import { SkillType } from '../../generated/prisma/client';

jest.mock('../../generated/prisma/client', () => ({
  SkillType: {
    SYSTEM: 'SYSTEM',
    CUSTOM: 'CUSTOM',
  },
}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const MOCK_USER_ID = 'cuid-user-1';
const MOCK_OTHER_USER_ID = 'cuid-user-2';
const MOCK_SKILL_ID = 'cuid-skill-1';

const mockCustomSkill = {
  id: MOCK_SKILL_ID,
  name: 'Custom Skill',
  description: 'A custom skill',
  content: '# Custom Skill\n\nSome markdown content.',
  type: SkillType.CUSTOM,
  tags: ['test', 'custom'],
  isPublic: false,
  createdBy: MOCK_USER_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockSystemSkill = {
  id: 'cuid-skill-system',
  name: 'System Skill',
  description: 'A system skill',
  content: '# System Skill\n\nSystem content.',
  type: SkillType.SYSTEM,
  tags: ['system'],
  isPublic: true,
  createdBy: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPublicSkill = {
  id: 'cuid-skill-public',
  name: 'Public Skill',
  description: 'A public skill',
  content: '# Public Skill\n\nPublic content.',
  type: SkillType.CUSTOM,
  tags: ['public'],
  isPublic: true,
  createdBy: MOCK_OTHER_USER_ID,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  skill: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('SkillService', () => {
  let service: SkillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create CUSTOM skill with createdBy', async () => {
      mockPrismaService.skill.create.mockResolvedValue(mockCustomSkill);

      const dto = {
        name: 'Custom Skill',
        description: 'A custom skill',
        content: '# Custom Skill\n\nSome markdown content.',
        tags: ['test', 'custom'],
      };

      const result = await service.create(MOCK_USER_ID, dto);

      expect(mockPrismaService.skill.create).toHaveBeenCalledWith({
        data: {
          name: dto.name,
          description: dto.description,
          content: dto.content,
          tags: dto.tags,
          type: SkillType.CUSTOM,
          createdBy: MOCK_USER_ID,
        },
      });
      expect(result).toEqual(mockCustomSkill);
    });
  });

  describe('findAll', () => {
    it("should return user's custom + system + public skills", async () => {
      const allSkills = [mockCustomSkill, mockSystemSkill, mockPublicSkill];
      mockPrismaService.skill.findMany.mockResolvedValue(allSkills);

      const result = await service.findAll(MOCK_USER_ID);

      expect(mockPrismaService.skill.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdBy: MOCK_USER_ID },
            { type: SkillType.SYSTEM },
            { isPublic: true },
          ],
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toHaveLength(3);
    });
  });

  describe('findOne', () => {
    it('should return skill by id', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockCustomSkill);

      const result = await service.findOne(MOCK_SKILL_ID);

      expect(mockPrismaService.skill.findUnique).toHaveBeenCalledWith({
        where: { id: MOCK_SKILL_ID },
      });
      expect(result).toEqual(mockCustomSkill);
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(null);

      await expect(service.findOne('nonexistent-id')).rejects.toThrow(
        NotFoundException
      );
    });
  });

  describe('update', () => {
    it('should update skill when user is owner', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockCustomSkill);
      const updatedSkill = { ...mockCustomSkill, name: 'Updated Skill' };
      mockPrismaService.skill.update.mockResolvedValue(updatedSkill);

      const result = await service.update(MOCK_SKILL_ID, MOCK_USER_ID, {
        name: 'Updated Skill',
      });

      expect(mockPrismaService.skill.update).toHaveBeenCalledWith({
        where: { id: MOCK_SKILL_ID },
        data: { name: 'Updated Skill' },
      });
      expect(result.name).toBe('Updated Skill');
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockCustomSkill);

      await expect(
        service.update(MOCK_SKILL_ID, MOCK_OTHER_USER_ID, {
          name: 'Hacked Skill',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.skill.update).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for SYSTEM skills', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockSystemSkill);

      await expect(
        service.update('cuid-skill-system', MOCK_USER_ID, {
          name: 'Modified System',
        })
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.skill.update).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(null);

      await expect(
        service.update('nonexistent-id', MOCK_USER_ID, { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete skill when user is owner', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockCustomSkill);
      mockPrismaService.skill.delete.mockResolvedValue(mockCustomSkill);

      const result = await service.remove(MOCK_SKILL_ID, MOCK_USER_ID);

      expect(mockPrismaService.skill.delete).toHaveBeenCalledWith({
        where: { id: MOCK_SKILL_ID },
      });
      expect(result).toEqual({ message: 'Skill deleted successfully' });
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockCustomSkill);

      await expect(
        service.remove(MOCK_SKILL_ID, MOCK_OTHER_USER_ID)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.skill.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException for SYSTEM skills', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(mockSystemSkill);

      await expect(
        service.remove('cuid-skill-system', MOCK_USER_ID)
      ).rejects.toThrow(ForbiddenException);

      expect(mockPrismaService.skill.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when skill not found', async () => {
      mockPrismaService.skill.findUnique.mockResolvedValue(null);

      await expect(
        service.remove('nonexistent-id', MOCK_USER_ID)
      ).rejects.toThrow(NotFoundException);
    });
  });
});
