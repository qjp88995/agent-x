export const UserStatus = {
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  DELETED: 'DELETED',
} as const;

export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export interface UserResponse {
  id: string;
  email: string;
  name: string | null;
  role: string;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface UserActivityStats {
  agentCount: number;
  conversationCount: number;
  workspaceFileCount: number;
  apiKeyCount: number;
  skillCount: number;
}

export interface UserDetailResponse extends UserResponse {
  stats: UserActivityStats;
}

export interface UserListResponse {
  data: UserResponse[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name?: string;
  role?: string;
}

export interface UpdateUserRoleRequest {
  role: string;
}

export interface UpdateUserStatusRequest {
  status: UserStatus;
}

export interface ResetPasswordResponse {
  temporaryPassword: string;
}
