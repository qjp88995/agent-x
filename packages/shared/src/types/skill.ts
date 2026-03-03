export const SkillType = {
  SYSTEM: 'SYSTEM',
  CUSTOM: 'CUSTOM',
} as const;

export type SkillType = (typeof SkillType)[keyof typeof SkillType];

export interface CreateSkillDto {
  name: string;
  description?: string;
  content: string;
  tags?: string[];
}

export interface UpdateSkillDto {
  name?: string;
  description?: string;
  content?: string;
  tags?: string[];
}

export interface SkillResponse {
  id: string;
  name: string;
  description: string | null;
  content: string;
  type: SkillType;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}
