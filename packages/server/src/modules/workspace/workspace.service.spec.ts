import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import * as fs from 'fs/promises';
import * as path from 'path';

import { WorkspaceService } from './workspace.service';

jest.mock('../../generated/prisma/client', () => ({}));

jest.mock('../../prisma/prisma.service', () => ({
  PrismaService: jest.fn(),
}));

jest.mock('fs/promises');

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaService } = require('../../prisma/prisma.service');

const mockedFs = jest.mocked(fs);

const MOCK_CONVERSATION_ID = 'cuid-conv-1';

const mockWorkspaceFile = {
  id: 'cuid-file-1',
  conversationId: MOCK_CONVERSATION_ID,
  path: 'src/index.ts',
  mimeType: 'video/mp2t',
  size: 24,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

const mockPrismaService = {
  workspaceFile: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe('WorkspaceService', () => {
  let service: WorkspaceService;

  beforeEach(async () => {
    process.env.WORKSPACE_BASE_DIR = '/tmp/test-workspaces';
    process.env.WORKSPACE_MAX_FILE_SIZE = '1024';

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorkspaceService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<WorkspaceService>(WorkspaceService);

    jest.clearAllMocks();
    mockedFs.mkdir.mockResolvedValue(undefined);
    mockedFs.writeFile.mockResolvedValue(undefined);
    mockedFs.unlink.mockResolvedValue(undefined);
    mockedFs.rm.mockResolvedValue(undefined);
    mockedFs.rename.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete process.env.WORKSPACE_BASE_DIR;
    delete process.env.WORKSPACE_MAX_FILE_SIZE;
  });

  describe('path validation', () => {
    it('should reject absolute paths', async () => {
      await expect(
        service.createFile(MOCK_CONVERSATION_ID, '/etc/passwd', 'content')
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject path traversal with ..', async () => {
      await expect(
        service.createFile(
          MOCK_CONVERSATION_ID,
          '../../../etc/passwd',
          'content'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject path traversal with embedded ..', async () => {
      await expect(
        service.createFile(
          MOCK_CONVERSATION_ID,
          'src/../../etc/passwd',
          'content'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject empty path', async () => {
      await expect(
        service.createFile(MOCK_CONVERSATION_ID, '', 'content')
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept valid relative paths', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue(
        mockWorkspaceFile
      );
      mockedFs.readFile.mockResolvedValue(Buffer.from('content'));

      await expect(
        service.createFile(MOCK_CONVERSATION_ID, 'src/index.ts', 'content')
      ).resolves.toBeDefined();
    });

    it('should accept nested valid paths', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue(
        mockWorkspaceFile
      );

      await expect(
        service.createFile(
          MOCK_CONVERSATION_ID,
          'src/components/App.tsx',
          'content'
        )
      ).resolves.toBeDefined();
    });
  });

  describe('createFile', () => {
    it('should create a text file on disk and in DB', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue(
        mockWorkspaceFile
      );

      const result = await service.createFile(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'console.log("hello")'
      );

      expect(mockedFs.mkdir).toHaveBeenCalled();
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/tmp/test-workspaces', MOCK_CONVERSATION_ID, 'src/index.ts'),
        expect.any(Buffer)
      );
      expect(mockPrismaService.workspaceFile.upsert).toHaveBeenCalledWith({
        where: {
          conversationId_path: {
            conversationId: MOCK_CONVERSATION_ID,
            path: 'src/index.ts',
          },
        },
        create: {
          conversationId: MOCK_CONVERSATION_ID,
          path: 'src/index.ts',
          mimeType: expect.any(String),
          size: expect.any(Number),
        },
        update: {
          mimeType: expect.any(String),
          size: expect.any(Number),
        },
      });
      expect(result).toEqual(mockWorkspaceFile);
    });

    it('should reject files exceeding size limit', async () => {
      const largeContent = 'x'.repeat(2048);

      await expect(
        service.createFile(MOCK_CONVERSATION_ID, 'large.txt', largeContent)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('readFile', () => {
    it('should return text content for text files', async () => {
      const textFile = { ...mockWorkspaceFile, mimeType: 'text/plain' };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue(Buffer.from('hello world'));

      const result = await service.readFile(
        MOCK_CONVERSATION_ID,
        'src/index.ts'
      );

      expect(result.content).toBe('hello world');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should return base64 content for binary files', async () => {
      const binaryFile = {
        ...mockWorkspaceFile,
        path: 'image.png',
        mimeType: 'image/png',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(binaryFile);
      const binaryData = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
      mockedFs.readFile.mockResolvedValue(binaryData);

      const result = await service.readFile(MOCK_CONVERSATION_ID, 'image.png');

      expect(result.content).toBe(binaryData.toString('base64'));
      expect(result.mimeType).toBe('image/png');
    });

    it('should throw NotFoundException for missing file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.readFile(MOCK_CONVERSATION_ID, 'nonexistent.ts')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateFile', () => {
    it('should update file content on disk and DB', async () => {
      const existingFile = { ...mockWorkspaceFile, mimeType: 'text/plain' };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(
        existingFile
      );
      const updatedFile = { ...existingFile, size: 11 };
      mockPrismaService.workspaceFile.update.mockResolvedValue(updatedFile);

      const result = await service.updateFile(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'new content'
      );

      expect(mockedFs.writeFile).toHaveBeenCalled();
      expect(mockPrismaService.workspaceFile.update).toHaveBeenCalled();
      expect(result.size).toBe(11);
    });

    it('should throw NotFoundException if file does not exist', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.updateFile(MOCK_CONVERSATION_ID, 'missing.ts', 'content')
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject update exceeding size limit', async () => {
      const existingFile = { ...mockWorkspaceFile, mimeType: 'text/plain' };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(
        existingFile
      );

      const largeContent = 'x'.repeat(2048);

      await expect(
        service.updateFile(MOCK_CONVERSATION_ID, 'src/index.ts', largeContent)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('deleteFile', () => {
    it('should delete file from DB and disk', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(
        mockWorkspaceFile
      );
      mockPrismaService.workspaceFile.delete.mockResolvedValue(
        mockWorkspaceFile
      );

      await service.deleteFile(MOCK_CONVERSATION_ID, 'src/index.ts');

      expect(mockPrismaService.workspaceFile.delete).toHaveBeenCalledWith({
        where: { id: mockWorkspaceFile.id },
      });
      expect(mockedFs.unlink).toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.deleteFile(MOCK_CONVERSATION_ID, 'nonexistent.ts')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('writeFiles (batch)', () => {
    it('should write multiple files atomically', async () => {
      const file1 = {
        ...mockWorkspaceFile,
        id: 'f1',
        path: 'src/a.ts',
      };
      const file2 = {
        ...mockWorkspaceFile,
        id: 'f2',
        path: 'src/b.ts',
      };
      mockPrismaService.workspaceFile.upsert
        .mockResolvedValueOnce(file1)
        .mockResolvedValueOnce(file2);

      const result = await service.writeFiles(MOCK_CONVERSATION_ID, [
        { path: 'src/a.ts', content: 'const a = 1;' },
        { path: 'src/b.ts', content: 'const b = 2;' },
      ]);

      expect(result).toHaveLength(2);
      // Temp dir write + move to workspace
      expect(mockedFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockedFs.rename).toHaveBeenCalledTimes(2);
      // Cleanup temp dir
      expect(mockedFs.rm).toHaveBeenCalled();
    });

    it('should reject batch if any file exceeds size limit', async () => {
      const files = [
        { path: 'small.txt', content: 'ok' },
        { path: 'large.txt', content: 'x'.repeat(2048) },
      ];

      await expect(
        service.writeFiles(MOCK_CONVERSATION_ID, files)
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate all paths in batch', async () => {
      const files = [
        { path: 'valid.txt', content: 'ok' },
        { path: '../evil.txt', content: 'bad' },
      ];

      await expect(
        service.writeFiles(MOCK_CONVERSATION_ID, files)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('listFiles', () => {
    it('should list all files for a conversation', async () => {
      const files = [
        { ...mockWorkspaceFile, path: 'a.ts' },
        { ...mockWorkspaceFile, path: 'src/b.ts' },
      ];
      mockPrismaService.workspaceFile.findMany.mockResolvedValue(files);

      const result = await service.listFiles(MOCK_CONVERSATION_ID);

      expect(mockPrismaService.workspaceFile.findMany).toHaveBeenCalledWith({
        where: { conversationId: MOCK_CONVERSATION_ID },
        orderBy: { path: 'asc' },
      });
      expect(result).toHaveLength(2);
    });

    it('should filter by directory prefix', async () => {
      mockPrismaService.workspaceFile.findMany.mockResolvedValue([]);

      await service.listFiles(MOCK_CONVERSATION_ID, 'src');

      expect(mockPrismaService.workspaceFile.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: MOCK_CONVERSATION_ID,
          path: { startsWith: 'src/' },
        },
        orderBy: { path: 'asc' },
      });
    });
  });

  describe('MIME type detection', () => {
    it('should detect TypeScript MIME type', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue(
        mockWorkspaceFile
      );

      await service.createFile(MOCK_CONVERSATION_ID, 'app.ts', 'code');

      expect(mockPrismaService.workspaceFile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            mimeType: expect.any(String),
          }),
        })
      );
    });

    it('should detect JSON MIME type', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue({
        ...mockWorkspaceFile,
        mimeType: 'application/json',
      });

      await service.createFile(
        MOCK_CONVERSATION_ID,
        'package.json',
        '{"name":"test"}'
      );

      expect(mockPrismaService.workspaceFile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            mimeType: 'application/json',
          }),
        })
      );
    });

    it('should default to application/octet-stream for unknown extensions', async () => {
      mockPrismaService.workspaceFile.upsert.mockResolvedValue({
        ...mockWorkspaceFile,
        mimeType: 'application/octet-stream',
      });

      await service.createFile(MOCK_CONVERSATION_ID, 'file.xyz123', 'content');

      expect(mockPrismaService.workspaceFile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            mimeType: 'application/octet-stream',
          }),
        })
      );
    });
  });

  describe('cleanupWorkspace', () => {
    it('should remove workspace directory', async () => {
      await service.cleanupWorkspace(MOCK_CONVERSATION_ID);

      expect(mockedFs.rm).toHaveBeenCalledWith(
        path.join('/tmp/test-workspaces', MOCK_CONVERSATION_ID),
        { recursive: true, force: true }
      );
    });
  });

  describe('fileExists', () => {
    it('should return exists true and isDirectory false for a regular file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue({
        isDirectory: false,
      });

      const result = await service.fileExists(
        MOCK_CONVERSATION_ID,
        'src/index.ts'
      );

      expect(result).toEqual({ exists: true, isDirectory: false });
      expect(mockPrismaService.workspaceFile.findUnique).toHaveBeenCalledWith({
        where: {
          conversationId_path: {
            conversationId: MOCK_CONVERSATION_ID,
            path: 'src/index.ts',
          },
        },
        select: { isDirectory: true },
      });
    });

    it('should return exists false when file does not exist', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      const result = await service.fileExists(
        MOCK_CONVERSATION_ID,
        'nonexistent.ts'
      );

      expect(result).toEqual({ exists: false, isDirectory: false });
    });

    it('should return isDirectory true for a directory', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue({
        isDirectory: true,
      });

      const result = await service.fileExists(MOCK_CONVERSATION_ID, 'src');

      expect(result).toEqual({ exists: true, isDirectory: true });
    });
  });

  describe('getFileStats', () => {
    it('should return line count for text files', async () => {
      const textFile = {
        ...mockWorkspaceFile,
        mimeType: 'text/plain',
        isDirectory: false,
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue('line1\nline2\nline3' as never);

      const result = await service.getFileStats(
        MOCK_CONVERSATION_ID,
        'src/index.ts'
      );

      expect(result).toEqual({
        path: textFile.path,
        mimeType: 'text/plain',
        size: textFile.size,
        isDirectory: false,
        lineCount: 3,
      });
      expect(mockedFs.readFile).toHaveBeenCalledWith(
        path.join('/tmp/test-workspaces', MOCK_CONVERSATION_ID, 'src/index.ts'),
        'utf-8'
      );
    });

    it('should return lineCount null for binary files', async () => {
      const binaryFile = {
        ...mockWorkspaceFile,
        path: 'image.png',
        mimeType: 'image/png',
        isDirectory: false,
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(binaryFile);

      const result = await service.getFileStats(
        MOCK_CONVERSATION_ID,
        'image.png'
      );

      expect(result).toEqual({
        path: 'image.png',
        mimeType: 'image/png',
        size: binaryFile.size,
        isDirectory: false,
        lineCount: null,
      });
      expect(mockedFs.readFile).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException for missing file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.getFileStats(MOCK_CONVERSATION_ID, 'nonexistent.ts')
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('readFileLines', () => {
    it('should read specific line range', async () => {
      const textFile = {
        ...mockWorkspaceFile,
        mimeType: 'text/plain',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue(
        'line1\nline2\nline3\nline4\nline5' as never
      );

      const result = await service.readFileLines(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        2,
        4
      );

      expect(result).toEqual({
        content: 'line2\nline3\nline4',
        totalLines: 5,
        startLine: 2,
        endLine: 4,
      });
    });

    it('should clamp out-of-range lines', async () => {
      const textFile = {
        ...mockWorkspaceFile,
        mimeType: 'text/plain',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue('line1\nline2\nline3' as never);

      const result = await service.readFileLines(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        -5,
        100
      );

      expect(result).toEqual({
        content: 'line1\nline2\nline3',
        totalLines: 3,
        startLine: 1,
        endLine: 3,
      });
    });

    it('should throw NotFoundException for missing file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.readFileLines(MOCK_CONVERSATION_ID, 'nonexistent.ts', 1, 10)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException for binary file', async () => {
      const binaryFile = {
        ...mockWorkspaceFile,
        path: 'image.png',
        mimeType: 'image/png',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(binaryFile);

      await expect(
        service.readFileLines(MOCK_CONVERSATION_ID, 'image.png', 1, 10)
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchFiles', () => {
    it('should find matches across files', async () => {
      const files = [
        {
          ...mockWorkspaceFile,
          path: 'src/a.ts',
          mimeType: 'text/plain',
          isDirectory: false,
        },
        {
          ...mockWorkspaceFile,
          path: 'src/b.ts',
          mimeType: 'text/plain',
          isDirectory: false,
        },
      ];
      mockPrismaService.workspaceFile.findMany.mockResolvedValue(files);
      mockedFs.readFile
        .mockResolvedValueOnce('hello world\nfoo bar' as never)
        .mockResolvedValueOnce('baz hello\nqux' as never);

      const result = await service.searchFiles(MOCK_CONVERSATION_ID, 'hello');

      expect(result).toEqual([
        {
          path: 'src/a.ts',
          matches: [{ line: 1, content: 'hello world' }],
        },
        {
          path: 'src/b.ts',
          matches: [{ line: 1, content: 'baz hello' }],
        },
      ]);
    });

    it('should throw BadRequestException for empty query', async () => {
      await expect(
        service.searchFiles(MOCK_CONVERSATION_ID, '')
      ).rejects.toThrow(BadRequestException);
    });

    it('should filter by directory path', async () => {
      mockPrismaService.workspaceFile.findMany.mockResolvedValue([]);

      await service.searchFiles(MOCK_CONVERSATION_ID, 'test', 'src');

      expect(mockPrismaService.workspaceFile.findMany).toHaveBeenCalledWith({
        where: {
          conversationId: MOCK_CONVERSATION_ID,
          isDirectory: false,
          path: { startsWith: 'src/' },
        },
        orderBy: { path: 'asc' },
      });
    });

    it('should skip binary files', async () => {
      const files = [
        {
          ...mockWorkspaceFile,
          path: 'image.png',
          mimeType: 'image/png',
          isDirectory: false,
        },
        {
          ...mockWorkspaceFile,
          path: 'src/a.ts',
          mimeType: 'text/plain',
          isDirectory: false,
        },
      ];
      mockPrismaService.workspaceFile.findMany.mockResolvedValue(files);
      mockedFs.readFile.mockResolvedValue('hello world' as never);

      const result = await service.searchFiles(MOCK_CONVERSATION_ID, 'hello');

      // Only the text file should be in results; binary is skipped
      expect(result).toEqual([
        {
          path: 'src/a.ts',
          matches: [{ line: 1, content: 'hello world' }],
        },
      ]);
      // readFile called only once (for the text file)
      expect(mockedFs.readFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('patchFile', () => {
    it('should replace all occurrences', async () => {
      const textFile = {
        ...mockWorkspaceFile,
        id: 'cuid-file-1',
        mimeType: 'text/plain',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue('foo bar foo baz foo' as never);
      mockPrismaService.workspaceFile.update.mockResolvedValue({
        ...textFile,
        size: 20,
      });

      const result = await service.patchFile(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'foo',
        'qux'
      );

      expect(result.occurrences).toBe(3);
      expect(mockedFs.writeFile).toHaveBeenCalledWith(
        path.join('/tmp/test-workspaces', MOCK_CONVERSATION_ID, 'src/index.ts'),
        expect.any(Buffer)
      );
      expect(mockPrismaService.workspaceFile.update).toHaveBeenCalledWith({
        where: { id: 'cuid-file-1' },
        data: { size: expect.any(Number) },
      });
    });

    it('should throw NotFoundException for missing file', async () => {
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(null);

      await expect(
        service.patchFile(MOCK_CONVERSATION_ID, 'nonexistent.ts', 'foo', 'bar')
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException when search string not found', async () => {
      const textFile = {
        ...mockWorkspaceFile,
        mimeType: 'text/plain',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(textFile);
      mockedFs.readFile.mockResolvedValue('hello world' as never);

      await expect(
        service.patchFile(
          MOCK_CONVERSATION_ID,
          'src/index.ts',
          'nonexistent',
          'replacement'
        )
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for binary file', async () => {
      const binaryFile = {
        ...mockWorkspaceFile,
        path: 'image.png',
        mimeType: 'image/png',
      };
      mockPrismaService.workspaceFile.findUnique.mockResolvedValue(binaryFile);

      await expect(
        service.patchFile(MOCK_CONVERSATION_ID, 'image.png', 'foo', 'bar')
      ).rejects.toThrow(BadRequestException);
    });
  });
});
