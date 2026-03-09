import { createContext, type ReactNode, useContext, useMemo } from 'react';

import type { AxiosInstance } from 'axios';

import { api } from '@/lib/api';

interface WorkspaceApiConfig {
  readonly client: AxiosInstance;
  readonly filesUrl: (conversationId: string) => string;
}

const defaultConfig: WorkspaceApiConfig = {
  client: api,
  filesUrl: (id: string) => `/conversations/${id}/files`,
};

const WorkspaceApiContext = createContext<WorkspaceApiConfig>(defaultConfig);

export function useWorkspaceApi() {
  return useContext(WorkspaceApiContext);
}

interface WorkspaceApiProviderProps {
  readonly client: AxiosInstance;
  readonly filesUrl: (conversationId: string) => string;
  readonly children: ReactNode;
}

export function WorkspaceApiProvider({
  client,
  filesUrl,
  children,
}: WorkspaceApiProviderProps) {
  const config = useMemo(() => ({ client, filesUrl }), [client, filesUrl]);
  return (
    <WorkspaceApiContext.Provider value={config}>
      {children}
    </WorkspaceApiContext.Provider>
  );
}
