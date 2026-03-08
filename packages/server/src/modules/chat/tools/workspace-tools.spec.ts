import { createWorkspaceTools } from './workspace-tools';

const MOCK_CONVERSATION_ID = 'cuid-conv-1';

const toolCtx = {
  toolCallId: 'test',
  messages: [],
  abortSignal: undefined as any,
};

const mockFile = {
  id: 'file-1',
  path: 'src/index.ts',
  mimeType: 'video/mp2t',
  size: 20,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockWorkspaceService = {
  createFile: jest.fn(),
  readFile: jest.fn(),
  updateFile: jest.fn(),
  deleteFile: jest.fn(),
  writeFiles: jest.fn(),
  listFiles: jest.fn(),
  fileExists: jest.fn(),
  getFileStats: jest.fn(),
  readFileLines: jest.fn(),
  searchFiles: jest.fn(),
  patchFile: jest.fn(),
  renameFile: jest.fn(),
  createDirectory: jest.fn(),
  deleteDirectory: jest.fn(),
};

describe('workspace tools', () => {
  let tools: ReturnType<typeof createWorkspaceTools>;

  beforeEach(() => {
    jest.clearAllMocks();
    tools = createWorkspaceTools(
      mockWorkspaceService as any,
      MOCK_CONVERSATION_ID
    );
  });

  describe('createFile', () => {
    it('should create a file and return success', async () => {
      mockWorkspaceService.createFile.mockResolvedValue(mockFile);

      const result = await tools.createFile.execute!(
        { path: 'src/index.ts', content: 'hello' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        file: {
          id: 'file-1',
          path: 'src/index.ts',
          mimeType: 'video/mp2t',
          size: 20,
        },
      });
      expect(mockWorkspaceService.createFile).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'hello'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.createFile.mockRejectedValue(
        new Error('Path traversal is not allowed')
      );

      const result = await tools.createFile.execute!(
        { path: '../evil.txt', content: 'bad' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Path traversal is not allowed',
      });
    });
  });

  describe('readFile', () => {
    it('should read and return file content', async () => {
      mockWorkspaceService.readFile.mockResolvedValue({
        content: 'console.log("hi")',
        mimeType: 'video/mp2t',
        size: 17,
      });

      const result = await tools.readFile.execute!(
        { path: 'src/index.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        content: 'console.log("hi")',
        mimeType: 'video/mp2t',
        size: 17,
      });
    });

    it('should return error for missing file', async () => {
      mockWorkspaceService.readFile.mockRejectedValue(
        new Error('File not found: missing.ts')
      );

      const result = await tools.readFile.execute!(
        { path: 'missing.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'File not found: missing.ts',
      });
    });
  });

  describe('updateFile', () => {
    it('should update file and return success', async () => {
      const updatedFile = { ...mockFile, size: 11 };
      mockWorkspaceService.updateFile.mockResolvedValue(updatedFile);

      const result = await tools.updateFile.execute!(
        { path: 'src/index.ts', content: 'new content' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        file: {
          id: 'file-1',
          path: 'src/index.ts',
          mimeType: 'video/mp2t',
          size: 11,
        },
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete file and return success', async () => {
      mockWorkspaceService.deleteFile.mockResolvedValue(undefined);

      const result = await tools.deleteFile.execute!(
        { path: 'src/index.ts' },
        toolCtx
      );

      expect(result).toEqual({ success: true, path: 'src/index.ts' });
    });
  });

  describe('writeFiles', () => {
    it('should batch write files and return results', async () => {
      const files = [
        { ...mockFile, id: 'f1', path: 'a.ts' },
        { ...mockFile, id: 'f2', path: 'b.ts' },
      ];
      mockWorkspaceService.writeFiles.mockResolvedValue(files);

      const result = await tools.writeFiles.execute!(
        {
          files: [
            { path: 'a.ts', content: 'a' },
            { path: 'b.ts', content: 'b' },
          ],
        },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        files: [
          { id: 'f1', path: 'a.ts', mimeType: 'video/mp2t', size: 20 },
          { id: 'f2', path: 'b.ts', mimeType: 'video/mp2t', size: 20 },
        ],
      });
    });
  });

  describe('listFiles', () => {
    it('should list all files', async () => {
      mockWorkspaceService.listFiles.mockResolvedValue([mockFile]);

      const result = await tools.listFiles.execute!({}, toolCtx);

      expect(result).toEqual({
        success: true,
        files: [
          {
            id: 'file-1',
            path: 'src/index.ts',
            mimeType: 'video/mp2t',
            size: 20,
          },
        ],
      });
      expect(mockWorkspaceService.listFiles).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        undefined
      );
    });

    it('should list files in a subdirectory', async () => {
      mockWorkspaceService.listFiles.mockResolvedValue([]);

      await tools.listFiles.execute!({ path: 'src' }, toolCtx);

      expect(mockWorkspaceService.listFiles).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src'
      );
    });
  });

  describe('fileExists', () => {
    it('should return true when file exists', async () => {
      mockWorkspaceService.fileExists.mockResolvedValue({
        exists: true,
        isDirectory: false,
      });

      const result = await tools.fileExists.execute!(
        { path: 'src/index.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        exists: true,
        isDirectory: false,
      });
      expect(mockWorkspaceService.fileExists).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts'
      );
    });

    it('should return false when file does not exist', async () => {
      mockWorkspaceService.fileExists.mockResolvedValue({
        exists: false,
        isDirectory: false,
      });

      const result = await tools.fileExists.execute!(
        { path: 'missing.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        exists: false,
        isDirectory: false,
      });
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.fileExists.mockRejectedValue(
        new Error('Path traversal is not allowed')
      );

      const result = await tools.fileExists.execute!(
        { path: '../evil.txt' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Path traversal is not allowed',
      });
    });
  });

  describe('fileInfo', () => {
    it('should return file stats', async () => {
      mockWorkspaceService.getFileStats.mockResolvedValue({
        path: 'src/index.ts',
        mimeType: 'video/mp2t',
        size: 20,
        isDirectory: false,
        lineCount: 5,
      });

      const result = await tools.fileInfo.execute!(
        { path: 'src/index.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        path: 'src/index.ts',
        mimeType: 'video/mp2t',
        size: 20,
        isDirectory: false,
        lineCount: 5,
      });
      expect(mockWorkspaceService.getFileStats).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.getFileStats.mockRejectedValue(
        new Error('File not found: missing.ts')
      );

      const result = await tools.fileInfo.execute!(
        { path: 'missing.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'File not found: missing.ts',
      });
    });
  });

  describe('readFileLines', () => {
    it('should read specific lines from a file', async () => {
      mockWorkspaceService.readFileLines.mockResolvedValue({
        content: 'line 1\nline 2\nline 3',
        totalLines: 10,
        startLine: 1,
        endLine: 3,
      });

      const result = await tools.readFileLines.execute!(
        { path: 'src/index.ts', startLine: 1, endLine: 3 },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        content: 'line 1\nline 2\nline 3',
        totalLines: 10,
        startLine: 1,
        endLine: 3,
      });
      expect(mockWorkspaceService.readFileLines).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        1,
        3
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.readFileLines.mockRejectedValue(
        new Error('File not found: missing.ts')
      );

      const result = await tools.readFileLines.execute!(
        { path: 'missing.ts', startLine: 1, endLine: 5 },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'File not found: missing.ts',
      });
    });
  });

  describe('searchFiles', () => {
    it('should return search results', async () => {
      const searchResults = [
        { path: 'src/index.ts', line: 1, content: 'console.log("hello")' },
      ];
      mockWorkspaceService.searchFiles.mockResolvedValue(searchResults);

      const result = await tools.searchFiles.execute!(
        { query: 'hello' },
        toolCtx
      );

      expect(result).toEqual({ success: true, results: searchResults });
      expect(mockWorkspaceService.searchFiles).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'hello',
        undefined
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.searchFiles.mockRejectedValue(
        new Error('Search failed')
      );

      const result = await tools.searchFiles.execute!(
        { query: 'hello' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Search failed',
      });
    });
  });

  describe('patchFile', () => {
    it('should patch file and return result', async () => {
      mockWorkspaceService.patchFile.mockResolvedValue({
        size: 25,
        occurrences: 2,
      });

      const result = await tools.patchFile.execute!(
        { path: 'src/index.ts', search: 'old', replace: 'new' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        size: 25,
        occurrences: 2,
      });
      expect(mockWorkspaceService.patchFile).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'old',
        'new'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.patchFile.mockRejectedValue(
        new Error('Search string not found')
      );

      const result = await tools.patchFile.execute!(
        { path: 'src/index.ts', search: 'missing', replace: 'new' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Search string not found',
      });
    });
  });

  describe('renameFile', () => {
    it('should rename file and return result', async () => {
      const renamedFile = { ...mockFile, path: 'src/main.ts' };
      mockWorkspaceService.renameFile.mockResolvedValue(renamedFile);

      const result = await tools.renameFile.execute!(
        { oldPath: 'src/index.ts', newPath: 'src/main.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        file: {
          id: 'file-1',
          path: 'src/main.ts',
          mimeType: 'video/mp2t',
          size: 20,
        },
      });
      expect(mockWorkspaceService.renameFile).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/index.ts',
        'src/main.ts'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.renameFile.mockRejectedValue(
        new Error('File not found: missing.ts')
      );

      const result = await tools.renameFile.execute!(
        { oldPath: 'missing.ts', newPath: 'new.ts' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'File not found: missing.ts',
      });
    });
  });

  describe('createDirectory', () => {
    it('should create directory and return result', async () => {
      mockWorkspaceService.createDirectory.mockResolvedValue({
        id: 'dir-1',
        path: 'src/utils',
      });

      const result = await tools.createDirectory.execute!(
        { path: 'src/utils' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        directory: { id: 'dir-1', path: 'src/utils' },
      });
      expect(mockWorkspaceService.createDirectory).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/utils'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.createDirectory.mockRejectedValue(
        new Error('Path traversal is not allowed')
      );

      const result = await tools.createDirectory.execute!(
        { path: '../evil' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Path traversal is not allowed',
      });
    });
  });

  describe('deleteDirectory', () => {
    it('should delete directory and return deleted paths', async () => {
      mockWorkspaceService.deleteDirectory.mockResolvedValue([
        'src/utils',
        'src/utils/helper.ts',
      ]);

      const result = await tools.deleteDirectory.execute!(
        { path: 'src/utils' },
        toolCtx
      );

      expect(result).toEqual({
        success: true,
        deletedPaths: ['src/utils', 'src/utils/helper.ts'],
      });
      expect(mockWorkspaceService.deleteDirectory).toHaveBeenCalledWith(
        MOCK_CONVERSATION_ID,
        'src/utils'
      );
    });

    it('should return error on failure', async () => {
      mockWorkspaceService.deleteDirectory.mockRejectedValue(
        new Error('Directory not found')
      );

      const result = await tools.deleteDirectory.execute!(
        { path: 'missing-dir' },
        toolCtx
      );

      expect(result).toEqual({
        success: false,
        error: 'Directory not found',
      });
    });
  });
});
