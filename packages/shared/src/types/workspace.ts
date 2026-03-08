export interface WorkspaceFileResponse {
  id: string;
  conversationId: string;
  path: string;
  mimeType: string;
  size: number;
  isDirectory: boolean;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceFileTreeResponse = WorkspaceFileResponse[];

export interface WorkspaceFileContentResponse {
  content: string;
  mimeType: string;
  size: number;
  path: string;
}
