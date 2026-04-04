import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Badge,
  Button,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@agent-x/design';
import type { AgentResponse } from '@agent-x/shared';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useAddAgentSkill, useRemoveAgentSkill } from '@/hooks/use-agents';
import { useSkillMarket, useSkills } from '@/hooks/use-skills';

type BoundSkill = AgentResponse['skills'][number];

interface AgentSkillsTabProps {
  agentId: string;
  currentSkills: AgentResponse['skills'];
}

export function AgentSkillsTab({
  agentId,
  currentSkills,
}: AgentSkillsTabProps) {
  const { t } = useTranslation();
  const { data: customSkills } = useSkills();
  const { data: marketSkills } = useSkillMarket();
  const addSkill = useAddAgentSkill();
  const removeSkill = useRemoveAgentSkill();

  const boundIds = useMemo(
    () => new Set(currentSkills.map(s => s.skillId)),
    [currentSkills]
  );

  const allAvailable = [...(customSkills ?? []), ...(marketSkills ?? [])];
  const availableSkills = allAvailable.filter(
    (s, i, arr) =>
      !boundIds.has(s.id) && arr.findIndex(x => x.id === s.id) === i
  );

  function handleAdd(skillId: string) {
    addSkill.mutate(
      { agentId, skillId },
      {
        onSuccess: () => {
          toast.success(t('skills.created'));
        },
      }
    );
  }

  function handleRemove(skillId: string) {
    removeSkill.mutate(
      { agentId, skillId },
      {
        onSuccess: () => {
          toast.success(t('skills.deleted'));
        },
      }
    );
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      {/* Bound skills */}
      <div>
        <h3 className="text-sm font-medium">{t('agentSkills.boundSkills')}</h3>
        <p className="text-foreground-muted mb-3 text-xs">
          {t('agentSkills.boundSkillsDesc')}
        </p>
        {currentSkills.length === 0 ? (
          <p className="text-foreground-muted text-sm">
            {t('agentSkills.noBound')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {currentSkills.map(entry => (
              <BoundSkillItem
                key={entry.id}
                entry={entry}
                onRemove={() => handleRemove(entry.skillId)}
                isRemoving={
                  removeSkill.isPending &&
                  removeSkill.variables?.skillId === entry.skillId
                }
              />
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Available skills */}
      <div>
        <h3 className="text-sm font-medium">
          {t('agentSkills.availableSkills')}
        </h3>
        <p className="text-foreground-muted mb-3 text-xs">
          {t('agentSkills.availableSkillsDesc')}
        </p>
        {availableSkills.length === 0 ? (
          <p className="text-foreground-muted text-sm">
            {t('agentSkills.noAvailable')}
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {availableSkills.map(skill => (
              <div
                key={skill.id}
                className="flex items-center justify-between rounded-md border px-4 py-3"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{skill.name}</span>
                    {skill.tags.length > 0 &&
                      skill.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                  </div>
                  {skill.description && (
                    <p className="text-foreground-muted text-xs">
                      {skill.description}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleAdd(skill.id)}
                  disabled={addSkill.isPending}
                >
                  {addSkill.isPending &&
                  addSkill.variables?.skillId === skill.id ? (
                    <Loader2 className="mr-1 size-3 animate-spin" />
                  ) : (
                    <Plus className="mr-1 size-3" />
                  )}
                  {t('agentSkills.add')}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BoundSkillItem({
  entry,
  onRemove,
  isRemoving,
}: {
  entry: BoundSkill;
  onRemove: () => void;
  isRemoving: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-between rounded-md border px-4 py-3">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{entry.skill.name}</span>
          {entry.skill.tags.length > 0 &&
            entry.skill.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
        </div>
        {entry.skill.description && (
          <p className="text-foreground-muted text-xs">
            {entry.skill.description}
          </p>
        )}
      </div>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="sm"
            variant="ghost-destructive"
            onClick={onRemove}
            disabled={isRemoving}
          >
            {isRemoving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Trash2 className="size-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>{t('common.delete')}</TooltipContent>
      </Tooltip>
    </div>
  );
}
