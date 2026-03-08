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
});
