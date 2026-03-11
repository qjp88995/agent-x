import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@agent-x/design';
import type { SkillResponse } from '@agent-x/shared';
import { SkillType } from '@agent-x/shared';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const TYPE_BADGE_CONFIG: Record<
  string,
  { labelKey: string; className: string }
> = {
  [SkillType.SYSTEM]: {
    labelKey: 'skills.systemSkills',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [SkillType.CUSTOM]: {
    labelKey: 'skills.mySkills',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

function TypeBadge({ type }: { readonly type: string }) {
  const { t } = useTranslation();
  const config = TYPE_BADGE_CONFIG[type];
  if (!config) return null;
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {t(config.labelKey)}
    </Badge>
  );
}

interface SkillTableProps {
  readonly skills: SkillResponse[];
  readonly isAdmin: boolean;
  readonly onDelete: (skill: SkillResponse) => void;
  readonly onPreview: (skill: SkillResponse) => void;
}

export function SkillTable({
  skills,
  isAdmin,
  onDelete,
  onPreview,
}: SkillTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<SkillResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: skill => (
        <span className="text-foreground text-sm font-medium">
          {skill.name}
        </span>
      ),
    },
    {
      key: 'type',
      header: t('common.type', { defaultValue: 'Type' }),
      width: '120px',
      render: skill => <TypeBadge type={skill.type} />,
    },
    {
      key: 'description',
      header: t('common.description', { defaultValue: 'Description' }),
      render: skill =>
        skill.description ? (
          <span className="text-foreground-muted line-clamp-1 text-sm">
            {skill.description}
          </span>
        ) : (
          <span className="text-foreground-muted/50 text-sm italic">
            {t('common.noDescription')}
          </span>
        ),
    },
    {
      key: 'tags',
      header: t('common.tags', { defaultValue: 'Tags' }),
      width: '200px',
      render: skill =>
        skill.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {skill.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {skill.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{skill.tags.length - 3}
              </Badge>
            )}
          </div>
        ) : (
          <span className="text-foreground-muted/50 text-sm">—</span>
        ),
    },
  ];

  function rowActions(skill: SkillResponse) {
    const isCustom = skill.type === SkillType.CUSTOM;
    const isSystemAdmin = skill.type === SkillType.SYSTEM && isAdmin;
    const canDelete = isCustom || isSystemAdmin;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="size-7">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">{t('common.actions')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onPreview(skill)}>
            <Eye className="mr-2 size-4" />
            {t('common.preview', { defaultValue: 'Preview' })}
          </DropdownMenuItem>
          {isCustom && (
            <DropdownMenuItem
              onClick={() => navigate(`/skills/${skill.id}/edit`)}
            >
              <Pencil className="mr-2 size-4" />
              {t('common.edit')}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(skill)}
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DataTable<SkillResponse>
      columns={columns}
      data={skills}
      keyExtractor={skill => skill.id}
      rowActions={rowActions}
      emptyState={
        <span>
          {t('skills.noSkills', { defaultValue: 'No skills found.' })}
        </span>
      }
    />
  );
}
