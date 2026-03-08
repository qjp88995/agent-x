export interface WorkspaceFileResponse {
  id: string;
  conversationId: string;
  path: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt: string;
}

export type WorkspaceFileTreeResponse = WorkspaceFileResponse[];
