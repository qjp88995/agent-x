import type {
  UpdatePreferencesDto,
  UserPreferencesResponse,
} from '@agent-x/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api } from '@/lib/api';

export const PREFERENCES_KEY = ['preferences'] as const;

export function usePreferences() {
  return useQuery({
    queryKey: PREFERENCES_KEY,
    queryFn: async () => {
      const { data } = await api.get<UserPreferencesResponse>('/preferences');
      return data;
    },
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (dto: UpdatePreferencesDto) => {
      const { data } = await api.patch<UserPreferencesResponse>(
        '/preferences',
        dto
      );
      return data;
    },
    onSuccess: data => {
      queryClient.setQueryData(PREFERENCES_KEY, data);
    },
  });
}
