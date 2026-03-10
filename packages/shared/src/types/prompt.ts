export const PromptType = {
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM',
} as const;

export type PromptType = (typeof PromptType)[keyof typeof PromptType];

export interface PromptCategoryResponse {
  id: string;
  name: string;
  type: PromptType;
  createdAt: string;
}

export interface CreatePromptCategoryDto {
  name: string;
}

export interface CreatePromptDto {
  name: string;
  description?: string;
  content: string;
  categoryId?: string;
  tags?: string[];
}

export interface UpdatePromptDto {
  name?: string;
  description?: string;
  content?: string;
  categoryId?: string | null;
  tags?: string[];
}

export interface PromptResponse {
  id: string;
  name: string;
  description: string | null;
  content: string;
  type: PromptType;
  categoryId: string | null;
  category: PromptCategoryResponse | null;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
