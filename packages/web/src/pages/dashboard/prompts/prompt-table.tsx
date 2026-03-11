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
  readonly onPreview: (prompt: PromptResponse) => void;
}

export function PromptTable({
  prompts,
  isAdmin,
  onDelete,
  onPreview,
}: PromptTableProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns: Column<PromptResponse>[] = [
    {
      key: 'name',
      header: t('common.name'),
      render: prompt => (
        <span className="text-foreground text-sm font-medium">
          {prompt.name}
        </span>
      ),
    },
    {
      key: 'category',
      header: t('common.category', { defaultValue: 'Category' }),
      width: '160px',
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
      render: prompt => <TypeBadge type={prompt.type} />,
    },
    {
      key: 'description',
      header: t('common.description', { defaultValue: 'Description' }),
      render: prompt =>
        prompt.description ? (
          <span className="text-foreground-muted line-clamp-2 text-sm">
            {prompt.description}
          </span>
        ) : (
          <span className="text-foreground-muted/50 text-sm italic">
            {t('common.noDescription')}
          </span>
        ),
    },
  ];

  function rowActions(prompt: PromptResponse) {
    const isCustom = prompt.type === PromptType.CUSTOM;
    const isSystemAdmin = prompt.type === PromptType.SYSTEM && isAdmin;
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
          <DropdownMenuItem onClick={() => onPreview(prompt)}>
            <Eye className="mr-2 size-4" />
            {t('common.preview', { defaultValue: 'Preview' })}
          </DropdownMenuItem>
          {isCustom && (
            <DropdownMenuItem
              onClick={() => navigate(`/prompts/${prompt.id}/edit`)}
            >
              <Pencil className="mr-2 size-4" />
              {t('common.edit')}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              onClick={() => onDelete(prompt)}
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
    <DataTable<PromptResponse>
      columns={columns}
      data={prompts}
      keyExtractor={prompt => prompt.id}
      rowActions={rowActions}
      emptyState={
        <span>
          {t('prompts.noPrompts', { defaultValue: 'No prompts found.' })}
        </span>
      }
    />
  );
}
