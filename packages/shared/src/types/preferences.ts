export interface UserPreferencesResponse {
  theme: string | null;
  language: string | null;
}

export interface UpdatePreferencesDto {
  theme?: string | null;
  language?: string | null;
}
