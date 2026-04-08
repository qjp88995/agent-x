import { createContext, type ReactNode, useContext, useMemo } from 'react';

/** 最小 HTTP 客户端接口，AxiosInstance 结构上兼容此接口 */
export interface HttpClient {
  get<T>(url: string, config?: { responseType?: string }): Promise<{ data: T }>;
  post<T>(url: string, data?: unknown): Promise<{ data: T }>;
  put<T>(url: string, data?: unknown): Promise<{ data: T }>;
  patch<T>(url: string, data?: unknown): Promise<{ data: T }>;
  delete<T>(url: string, config?: { data?: unknown }): Promise<{ data: T }>;
}

export interface WorkspaceApiConfig {
  readonly client: HttpClient;
  /** 返回文件 API 的 base path，如 `/conversations/:id/files` */
  readonly filesUrl: (conversationId: string) => string;
  /**
   * 返回文件下载的完整 URL（含 web 层路由前缀，如 `/api`）
   * 用于图片预览 src 属性
   * 示例：(conversationId, fileId) => `/api/conversations/${conversationId}/files/${fileId}/download`
   */
  readonly downloadUrl: (conversationId: string, fileId: string) => string;
}

const WorkspaceApiContext = createContext<WorkspaceApiConfig | null>(null);

export function useWorkspaceApi(): WorkspaceApiConfig {
  const ctx = useContext(WorkspaceApiContext);
  if (!ctx) throw new Error('useWorkspaceApi must be used within WorkspaceApiProvider');
  return ctx;
}

interface WorkspaceApiProviderProps extends WorkspaceApiConfig {
  readonly children: ReactNode;
}

export function WorkspaceApiProvider({ client, filesUrl, downloadUrl, children }: WorkspaceApiProviderProps) {
  const value = useMemo(
    () => ({ client, filesUrl, downloadUrl }),
    [client, filesUrl, downloadUrl]
  );
  return (
    <WorkspaceApiContext.Provider value={value}>
      {children}
    </WorkspaceApiContext.Provider>
  );
}
