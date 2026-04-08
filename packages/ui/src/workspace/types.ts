// packages/ui/src/workspace/types.ts

export interface WorkspaceFile {
  readonly id: string;
  readonly name: string;
  readonly path: string;
  readonly mimeType: string;
  readonly isDirectory: boolean;
  readonly size: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ClipboardItem {
  readonly operation: 'copy' | 'cut';
  readonly type: 'file' | 'directory';
  readonly path: string;
  readonly fileId?: string;
}

export interface OpenTab {
  readonly file: WorkspaceFile;
  readonly modified: boolean;
}
