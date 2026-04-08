import { jsonSchema, type Tool,tool } from 'ai';

export interface SkillEntry {
  skillId: string;
  name: string;
  description?: string | null;
  content: string;
}

export function createSkillTools(
  skills: readonly SkillEntry[]
): Record<string, Tool> {
  if (skills.length === 0) return {};

  return {
    listSkills: tool({
      description:
        "List all skills configured for this agent. Returns each skill's ID, name, and description. Use loadSkill to read the full content of a specific skill.",
      inputSchema: jsonSchema<Record<string, never>>({
        type: 'object',
        properties: {},
      }),
      execute: async () => ({
        skills: skills.map(s => ({
          skillId: s.skillId,
          name: s.name,
          description: s.description ?? '',
        })),
      }),
    }),
    loadSkill: tool({
      description: 'Load the full content of a skill by its ID.',
      inputSchema: jsonSchema<{ skillId: string }>({
        type: 'object',
        required: ['skillId'],
        properties: {
          skillId: {
            type: 'string',
            description: 'The skillId returned by listSkills',
          },
        },
      }),
      execute: async ({ skillId }) => {
        const skill = skills.find(s => s.skillId === skillId);
        if (!skill) {
          return { error: `Skill "${skillId}" not found` };
        }
        return { name: skill.name, content: skill.content };
      },
    }),
  };
}
