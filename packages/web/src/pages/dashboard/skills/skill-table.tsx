import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import {
  Avatar,
  Badge,
  Button,
  type Column,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
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
  readonly onPreview?: (skill: SkillResponse) => void;
  readonly loading?: boolean;
}

export function SkillTable({
  skills,
  isAdmin,
  onDelete,
  onPreview,
  loading,
}: SkillTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<SkillResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: skill => (
        <div className="flex items-center gap-2.5">
          <Avatar name={skill.name} size="md" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {skill.name}
            </div>
            {skill.description && (
              <div className="text-xs text-foreground-ghost line-clamp-1">
                {skill.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      header: t('common.type', { defaultValue: 'Type' }),
      width: '120px',
      render: skill => <TypeBadge type={skill.type} />,
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
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={e => {
                e.stopPropagation();
                onPreview?.(skill);
              }}
            >
              <Eye className="size-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {t('common.preview', { defaultValue: 'Preview' })}
          </TooltipContent>
        </Tooltip>
        {isCustom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={e => {
                  e.stopPropagation();
                  navigate(`/skills/${skill.id}/edit`);
                }}
              >
                <Pencil className="size-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{t('common.edit')}</TooltipContent>
          </Tooltip>
        )}
        {canDelete && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={e => e.stopPropagation()}
              >
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => onDelete(skill)}
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <DataTable<SkillResponse>
      columns={columns}
      data={skills}
      keyExtractor={skill => skill.id}
      rowActions={rowActions}
      loading={loading}
      emptyState={
        <span>
          {t('skills.noSkills', { defaultValue: 'No skills found.' })}
        </span>
      }
    />
  );
}
