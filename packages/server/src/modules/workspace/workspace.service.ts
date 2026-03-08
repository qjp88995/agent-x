import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as fs from 'fs/promises';
import * as mime from 'mime-types';
import * as path from 'path';

import { PrismaService } from '../../prisma/prisma.service';

const DEFAULT_MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export interface WorkspaceFileInfo {
  id: string;
  path: string;
  mimeType: string;
  size: number;
  isDirectory: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WriteFileInput {
  path: string;
  content: string;
}

@Injectable()
export class WorkspaceService {
  private readonly maxFileSize: number;
  private readonly baseDir: string;

  constructor(private readonly prisma: PrismaService) {
    this.maxFileSize = parseInt(
      process.env.WORKSPACE_MAX_FILE_SIZE || String(DEFAULT_MAX_FILE_SIZE),
      10
    );
    this.baseDir = path.resolve(
      process.env.WORKSPACE_BASE_DIR || 'data/workspaces'
    );
  }

  private static readonly INVALID_FILENAME_CHARS = /[<>:"|?*]/;

  private static hasControlChars(str: string): boolean {
    for (let i = 0; i < str.length; i++) {
      if (str.charCodeAt(i) < 0x20) return true;
    }
    return false;
  }

  private validatePath(filePath: string): void {
    if (!filePath || typeof filePath !== 'string') {
      throw new BadRequestException('File path is required');
    }
    if (path.isAbsolute(filePath)) {
      throw new BadRequestException('Absolute paths are not allowed');
    }
    const normalized = path.normalize(filePath);
    if (normalized.startsWith('..') || normalized.includes(`..${path.sep}`)) {
      throw new BadRequestException('Path traversal is not allowed');
    }
    if (normalized.startsWith(path.sep)) {
      throw new BadRequestException('Absolute paths are not allowed');
    }
    // Validate each segment for illegal filename characters
    const segments = filePath.split('/');
    for (const segment of segments) {
      if (!segment) continue;
      if (
        WorkspaceService.INVALID_FILENAME_CHARS.test(segment) ||
        WorkspaceService.hasControlChars(segment)
      ) {
        throw new BadRequestException(
          `Invalid characters in filename: ${segment}`
        );
      }
      if (segment === '.' || segment === '..') {
        throw new BadRequestException('Invalid path segment');
      }
    }
  }

  private getWorkspaceDir(conversationId: string): string {
    return path.join(this.baseDir, conversationId);
  }

  private getDiskPath(conversationId: string, filePath: string): string {
    return path.join(this.getWorkspaceDir(conversationId), filePath);
  }

  private detectMimeType(filePath: string): string {
    return mime.lookup(filePath) || 'application/octet-stream';
  }

  private isTextMimeType(mimeType: string): boolean {
    return (
      mimeType.startsWith('text/') ||
      mimeType === 'application/json' ||
      mimeType === 'application/javascript' ||
      mimeType === 'application/typescript' ||
      mimeType === 'application/xml' ||
      mimeType === 'application/yaml' ||
      mimeType === 'application/x-yaml' ||
      mimeType === 'image/svg+xml'
    );
  }

  async createFile(
    conversationId: string,
    filePath: string,
    content: string
  ): Promise<WorkspaceFileInfo> {
    this.validatePath(filePath);

    const mimeType = this.detectMimeType(filePath);
    const isText = this.isTextMimeType(mimeType);
    const buffer = isText
      ? Buffer.from(content, 'utf-8')
      : Buffer.from(content, 'base64');

    if (buffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `File size ${buffer.length} exceeds limit of ${this.maxFileSize} bytes`
      );
    }

    const diskPath = this.getDiskPath(conversationId, filePath);
    await fs.mkdir(path.dirname(diskPath), { recursive: true });
    await fs.writeFile(diskPath, buffer);

    const record = await this.prisma.workspaceFile.upsert({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
      create: {
        conversationId,
        path: filePath,
        mimeType,
        size: buffer.length,
      },
      update: {
        mimeType,
        size: buffer.length,
      },
    });

    return record;
  }

  async readFile(
    conversationId: string,
    filePath: string
  ): Promise<{ content: string; mimeType: string; size: number }> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    const diskPath = this.getDiskPath(conversationId, filePath);
    const buffer = await fs.readFile(diskPath);
    const isText = this.isTextMimeType(record.mimeType);
    const content = isText
      ? buffer.toString('utf-8')
      : buffer.toString('base64');

    return { content, mimeType: record.mimeType, size: record.size };
  }

  async updateFile(
    conversationId: string,
    filePath: string,
    content: string
  ): Promise<WorkspaceFileInfo> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    const isText = this.isTextMimeType(record.mimeType);
    const buffer = isText
      ? Buffer.from(content, 'utf-8')
      : Buffer.from(content, 'base64');

    if (buffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `File size ${buffer.length} exceeds limit of ${this.maxFileSize} bytes`
      );
    }

    const diskPath = this.getDiskPath(conversationId, filePath);
    await fs.writeFile(diskPath, buffer);

    const updated = await this.prisma.workspaceFile.update({
      where: { id: record.id },
      data: { size: buffer.length },
    });

    return updated;
  }

  async deleteFile(conversationId: string, filePath: string): Promise<void> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    const diskPath = this.getDiskPath(conversationId, filePath);

    await this.prisma.workspaceFile.delete({ where: { id: record.id } });

    try {
      await fs.unlink(diskPath);
    } catch {
      // File may already be deleted from disk
    }
  }

  async writeFiles(
    conversationId: string,
    files: WriteFileInput[]
  ): Promise<WorkspaceFileInfo[]> {
    for (const file of files) {
      this.validatePath(file.path);
    }

    // Write to a temp directory first for atomicity
    const workspaceDir = this.getWorkspaceDir(conversationId);
    const tempDir = `${workspaceDir}.__tmp_${Date.now()}`;

    try {
      // Prepare buffers and validate sizes
      const prepared = files.map(file => {
        const mimeType = this.detectMimeType(file.path);
        const isText = this.isTextMimeType(mimeType);
        const buffer = isText
          ? Buffer.from(file.content, 'utf-8')
          : Buffer.from(file.content, 'base64');

        if (buffer.length > this.maxFileSize) {
          throw new BadRequestException(
            `File ${file.path}: size ${buffer.length} exceeds limit of ${this.maxFileSize} bytes`
          );
        }

        return { path: file.path, mimeType, buffer };
      });

      // Write all files to temp directory
      for (const file of prepared) {
        const tempPath = path.join(tempDir, file.path);
        await fs.mkdir(path.dirname(tempPath), { recursive: true });
        await fs.writeFile(tempPath, file.buffer);
      }

      // Move files from temp to workspace
      await fs.mkdir(workspaceDir, { recursive: true });
      for (const file of prepared) {
        const srcPath = path.join(tempDir, file.path);
        const destPath = path.join(workspaceDir, file.path);
        await fs.mkdir(path.dirname(destPath), { recursive: true });
        await fs.rename(srcPath, destPath);
      }

      // Upsert DB records
      const results: WorkspaceFileInfo[] = [];
      for (const file of prepared) {
        const record = await this.prisma.workspaceFile.upsert({
          where: {
            conversationId_path: { conversationId, path: file.path },
          },
          create: {
            conversationId,
            path: file.path,
            mimeType: file.mimeType,
            size: file.buffer.length,
          },
          update: {
            mimeType: file.mimeType,
            size: file.buffer.length,
          },
        });
        results.push(record);
      }

      return results;
    } finally {
      // Clean up temp directory
      try {
        await fs.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }

  async listFiles(
    conversationId: string,
    dirPath?: string
  ): Promise<WorkspaceFileInfo[]> {
    if (dirPath) {
      this.validatePath(dirPath);
    }

    const where: Record<string, unknown> = { conversationId };
    if (dirPath) {
      const prefix = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;
      where.path = { startsWith: prefix };
    }

    const files = await this.prisma.workspaceFile.findMany({
      where,
      orderBy: { path: 'asc' },
    });

    return files;
  }

  async getFileById(
    conversationId: string,
    fileId: string
  ): Promise<WorkspaceFileInfo> {
    const record = await this.prisma.workspaceFile.findUnique({
      where: { id: fileId },
    });

    if (!record || record.conversationId !== conversationId) {
      throw new NotFoundException('File not found');
    }

    return record;
  }

  async readFileById(
    conversationId: string,
    fileId: string
  ): Promise<{ content: Buffer; mimeType: string; fileName: string }> {
    const record = await this.getFileById(conversationId, fileId);
    const diskPath = this.getDiskPath(conversationId, record.path);
    const content = await fs.readFile(diskPath);
    const fileName = path.basename(record.path);

    return { content, mimeType: record.mimeType, fileName };
  }

  async updateFileById(
    conversationId: string,
    fileId: string,
    content: string
  ): Promise<WorkspaceFileInfo> {
    const record = await this.getFileById(conversationId, fileId);
    return this.updateFile(conversationId, record.path, content);
  }

  async cleanupWorkspace(conversationId: string): Promise<void> {
    const workspaceDir = this.getWorkspaceDir(conversationId);
    try {
      await fs.rm(workspaceDir, { recursive: true, force: true });
    } catch {
      // Directory may not exist
    }
  }

  async fileExists(
    conversationId: string,
    filePath: string
  ): Promise<{ exists: boolean; isDirectory: boolean }> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
      select: { isDirectory: true },
    });

    return {
      exists: !!record,
      isDirectory: record?.isDirectory ?? false,
    };
  }

  async getFileStats(
    conversationId: string,
    filePath: string
  ): Promise<{
    path: string;
    mimeType: string;
    size: number;
    isDirectory: boolean;
    lineCount: number | null;
  }> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    let lineCount: number | null = null;
    if (!record.isDirectory && this.isTextMimeType(record.mimeType)) {
      const diskPath = this.getDiskPath(conversationId, filePath);
      const content = await fs.readFile(diskPath, 'utf-8');
      lineCount = content.split('\n').length;
    }

    return {
      path: record.path,
      mimeType: record.mimeType,
      size: record.size,
      isDirectory: record.isDirectory,
      lineCount,
    };
  }

  async readFileLines(
    conversationId: string,
    filePath: string,
    startLine: number,
    endLine: number
  ): Promise<{
    content: string;
    totalLines: number;
    startLine: number;
    endLine: number;
  }> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    if (!this.isTextMimeType(record.mimeType)) {
      throw new BadRequestException('readFileLines only supports text files');
    }

    const diskPath = this.getDiskPath(conversationId, filePath);
    const content = await fs.readFile(diskPath, 'utf-8');
    const allLines = content.split('\n');
    const totalLines = allLines.length;

    const start = Math.max(1, startLine);
    const end = Math.min(totalLines, endLine);

    const selectedLines = allLines.slice(start - 1, end);

    return {
      content: selectedLines.join('\n'),
      totalLines,
      startLine: start,
      endLine: end,
    };
  }

  async searchFiles(
    conversationId: string,
    query: string,
    filePath?: string
  ): Promise<
    Array<{
      path: string;
      matches: Array<{ line: number; content: string }>;
    }>
  > {
    if (!query) {
      throw new BadRequestException('Search query is required');
    }

    const where: Record<string, unknown> = {
      conversationId,
      isDirectory: false,
    };
    if (filePath) {
      this.validatePath(filePath);
      const prefix = filePath.endsWith('/') ? filePath : `${filePath}/`;
      where.path = { startsWith: prefix };
    }

    const files = await this.prisma.workspaceFile.findMany({
      where,
      orderBy: { path: 'asc' },
    });

    const results: Array<{
      path: string;
      matches: Array<{ line: number; content: string }>;
    }> = [];
    const queryLower = query.toLowerCase();

    for (const file of files) {
      if (!this.isTextMimeType(file.mimeType)) continue;

      const diskPath = this.getDiskPath(conversationId, file.path);
      let content: string;
      try {
        content = await fs.readFile(diskPath, 'utf-8');
      } catch {
        continue;
      }

      const matches: Array<{ line: number; content: string }> = [];
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].toLowerCase().includes(queryLower)) {
          matches.push({ line: i + 1, content: lines[i] });
        }
      }

      if (matches.length > 0) {
        results.push({ path: file.path, matches });
      }
    }

    return results;
  }

  async patchFile(
    conversationId: string,
    filePath: string,
    search: string,
    replace: string
  ): Promise<{ size: number; occurrences: number }> {
    this.validatePath(filePath);

    const record = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: filePath },
      },
    });

    if (!record) {
      throw new NotFoundException(`File not found: ${filePath}`);
    }

    if (!this.isTextMimeType(record.mimeType)) {
      throw new BadRequestException('patchFile only supports text files');
    }

    const diskPath = this.getDiskPath(conversationId, filePath);
    const content = await fs.readFile(diskPath, 'utf-8');

    // Count occurrences
    let occurrences = 0;
    let idx = 0;
    while ((idx = content.indexOf(search, idx)) !== -1) {
      occurrences++;
      idx += search.length;
    }

    if (occurrences === 0) {
      throw new BadRequestException('Search string not found in file');
    }

    const newContent = content.split(search).join(replace);
    const buffer = Buffer.from(newContent, 'utf-8');

    if (buffer.length > this.maxFileSize) {
      throw new BadRequestException(
        `File size ${buffer.length} exceeds limit of ${this.maxFileSize} bytes`
      );
    }

    await fs.writeFile(diskPath, buffer);
    await this.prisma.workspaceFile.update({
      where: { id: record.id },
      data: { size: buffer.length },
    });

    return { size: buffer.length, occurrences };
  }

  async renameFile(
    conversationId: string,
    oldPath: string,
    newPath: string
  ): Promise<WorkspaceFileInfo> {
    this.validatePath(oldPath);
    this.validatePath(newPath);

    const workspaceDir = this.getWorkspaceDir(conversationId);
    const oldFullPath = path.join(workspaceDir, oldPath);
    const newFullPath = path.join(workspaceDir, newPath);

    // Verify source exists
    const file = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: oldPath },
      },
    });
    if (!file) {
      throw new NotFoundException(`File not found: ${oldPath}`);
    }

    // Check target doesn't exist
    const existing = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: newPath },
      },
    });
    if (existing) {
      throw new BadRequestException(`File already exists: ${newPath}`);
    }

    // Ensure target directory exists
    await fs.mkdir(path.dirname(newFullPath), { recursive: true });

    // Move on disk
    await fs.rename(oldFullPath, newFullPath);

    // Update DB
    const mimeType = mime.lookup(newPath) || 'application/octet-stream';
    return this.prisma.workspaceFile.update({
      where: { id: file.id },
      data: { path: newPath, mimeType },
    });
  }

  async createDirectory(
    conversationId: string,
    dirPath: string
  ): Promise<WorkspaceFileInfo> {
    this.validatePath(dirPath);
    const fullPath = path.join(this.getWorkspaceDir(conversationId), dirPath);
    await fs.mkdir(fullPath, { recursive: true });

    return this.prisma.workspaceFile.upsert({
      where: {
        conversationId_path: { conversationId, path: dirPath },
      },
      create: {
        conversationId,
        path: dirPath,
        mimeType: 'inode/directory',
        size: 0,
        isDirectory: true,
      },
      update: {},
    });
  }

  async deleteDirectory(
    conversationId: string,
    dirPath: string
  ): Promise<string[]> {
    this.validatePath(dirPath);

    const normalizedDir = dirPath.endsWith('/') ? dirPath : `${dirPath}/`;

    // Delete all files under this directory + the directory record itself
    const deleted = await this.prisma.workspaceFile.findMany({
      where: {
        conversationId,
        OR: [{ path: { startsWith: normalizedDir } }, { path: dirPath }],
      },
      select: { path: true },
    });

    await this.prisma.workspaceFile.deleteMany({
      where: {
        conversationId,
        OR: [{ path: { startsWith: normalizedDir } }, { path: dirPath }],
      },
    });

    // Delete from disk
    const fullPath = path.join(this.getWorkspaceDir(conversationId), dirPath);
    await fs.rm(fullPath, { recursive: true, force: true });

    return deleted.map(f => f.path);
  }

  async renameDirectory(
    conversationId: string,
    oldDir: string,
    newDir: string
  ): Promise<void> {
    this.validatePath(oldDir);
    this.validatePath(newDir);

    const normalizedOld = oldDir.endsWith('/') ? oldDir : `${oldDir}/`;
    const normalizedNew = newDir.endsWith('/') ? newDir : `${newDir}/`;

    const workspaceDir = this.getWorkspaceDir(conversationId);
    const oldFullPath = path.join(workspaceDir, oldDir);
    const newFullPath = path.join(workspaceDir, newDir);

    // Move on disk
    await fs.mkdir(path.dirname(newFullPath), { recursive: true });
    await fs.rename(oldFullPath, newFullPath);

    // Update the directory record itself
    const dirRecord = await this.prisma.workspaceFile.findUnique({
      where: {
        conversationId_path: { conversationId, path: oldDir },
      },
    });
    if (dirRecord) {
      await this.prisma.workspaceFile.update({
        where: { id: dirRecord.id },
        data: { path: newDir },
      });
    }

    // Update all file paths under the directory
    const files = await this.prisma.workspaceFile.findMany({
      where: {
        conversationId,
        path: { startsWith: normalizedOld },
      },
    });

    for (const file of files) {
      const relativePath = file.path.slice(normalizedOld.length);
      const updatedPath = `${normalizedNew}${relativePath}`;
      const mimeType = mime.lookup(updatedPath) || file.mimeType;
      await this.prisma.workspaceFile.update({
        where: { id: file.id },
        data: { path: updatedPath, mimeType },
      });
    }
  }
}
