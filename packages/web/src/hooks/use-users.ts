import type {
  CreateUserRequest,
  ResetPasswordResponse,
  UserDetailResponse,
  UserListResponse,
  UserResponse,
} from '@agent-x/shared';
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import { api } from '@/lib/api';

export interface UseUsersParams {
  search?: string;
  role?: string;
  status?: string;
  registeredFrom?: string;
  registeredTo?: string;
  sortBy?: string;
  sortOrder?: string;
  page?: number;
  pageSize?: number;
}

export function useUsers(params: UseUsersParams = {}) {
  return useQuery<UserListResponse>({
    queryKey: ['users', params],
    queryFn: async () => {
      const { data } = await api.get<UserListResponse>('/users', {
        params,
      });
      return data;
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllUsers() {
  return useQuery<UserResponse[]>({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const { data } = await api.get<UserListResponse>('/users', {
        params: { pageSize: 1000 },
      });
      return data.data;
    },
  });
}

export function useUser(id: string | undefined) {
  return useQuery<UserDetailResponse>({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get<UserDetailResponse>(`/users/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, CreateUserRequest>({
    mutationFn: async dto => {
      const { data } = await api.post<UserResponse>('/users', dto);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, { id: string; role: string }>({
    mutationFn: async ({ id, role }) => {
      const { data } = await api.patch<UserResponse>(`/users/${id}/role`, {
        role,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useUpdateUserStatus() {
  const queryClient = useQueryClient();

  return useMutation<UserResponse, Error, { id: string; status: string }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch<UserResponse>(`/users/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

export function useResetUserPassword() {
  return useMutation<ResetPasswordResponse, Error, string>({
    mutationFn: async id => {
      const { data } = await api.post<ResetPasswordResponse>(
        `/users/${id}/reset-password`
      );
      return data;
    },
  });
}
