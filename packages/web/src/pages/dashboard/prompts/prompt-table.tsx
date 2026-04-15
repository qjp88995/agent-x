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
import type { PromptResponse } from '@agent-x/shared';
import { PromptType } from '@agent-x/shared';
import { Eye, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';

import { cn } from '@/lib/utils';

const TYPE_BADGE_CONFIG: Record<
  string,
  { labelKey: string; className: string }
> = {
  [PromptType.SYSTEM]: {
    labelKey: 'prompts.systemPrompts',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  [PromptType.CUSTOM]: {
    labelKey: 'prompts.myPrompts',
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

interface PromptTableProps {
  readonly prompts: PromptResponse[];
  readonly isAdmin: boolean;
  readonly onDelete: (prompt: PromptResponse) => void;
  readonly onPreview?: (prompt: PromptResponse) => void;
  readonly loading?: boolean;
}

export function PromptTable({
  prompts,
  isAdmin,
  onDelete,
  onPreview,
  loading,
}: PromptTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<PromptResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: prompt => (
        <div className="flex items-center gap-2.5">
          <Avatar name={prompt.name} size="md" />
          <div>
            <div className="text-sm font-medium text-foreground">
              {prompt.name}
            </div>
            {prompt.description && (
              <div className="text-xs text-foreground-ghost line-clamp-1">
                {prompt.description}
              </div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: t('common.category', { defaultValue: 'Category' }),
      width: '160px',
      hideOnMobile: true,
      render: prompt =>
        prompt.category ? (
          <Badge variant="outline" className="text-xs">
            {prompt.category.name}
          </Badge>
        ) : (
          <span className="text-foreground-muted/50 text-sm">—</span>
        ),
    },
    {
      key: 'type',
      header: t('common.type', { defaultValue: 'Type' }),
      width: '120px',
      hideOnMobile: true,
      render: prompt => <TypeBadge type={prompt.type} />,
    },
  ];

  function rowActions(prompt: PromptResponse) {
    const isCustom = prompt.type === PromptType.CUSTOM;
    const isSystemAdmin = prompt.type === PromptType.SYSTEM && isAdmin;
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
                onPreview?.(prompt);
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
                  navigate(`/prompts/${prompt.id}/edit`);
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
                onClick={() => onDelete(prompt)}
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
    <DataTable<PromptResponse>
      columns={columns}
      data={prompts}
      keyExtractor={prompt => prompt.id}
      rowActions={rowActions}
      loading={loading}
      emptyState={
        <span>
          {t('prompts.noPrompts', { defaultValue: 'No prompts found.' })}
        </span>
      }
    />
  );
}
