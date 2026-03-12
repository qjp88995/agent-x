import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Card,
  CardContent,
  CardHeader,
  type FilterTab,
  FilterTabs,
  PageHeader,
  Skeleton,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { PromptResponse } from '@agent-x/shared';
import { PromptType } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/prompts/delete-dialog';
import { MarketplaceCard } from '@/components/prompts/marketplace-card';
import { PreviewDialog } from '@/components/prompts/preview-dialog';
import { PromptCard } from '@/components/prompts/prompt-card';
import { PromptEmptyState } from '@/components/prompts/prompt-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useDeleteMarketplacePrompt,
  useDeletePrompt,
  usePromptMarket,
  usePrompts,
} from '@/hooks/use-prompts';
import { useViewMode } from '@/hooks/use-view-mode';

import { PromptTable } from './prompt-table';

function PromptCardSkeleton() {
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-20 rounded-full" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-1.5 h-4 w-2/3" />
      </CardContent>
    </Card>
  );
}

export default function PromptsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [view, setView] = useViewMode('prompts');

  const {
    data: marketPrompts,
    isLoading: isLoadingMarket,
    error: marketError,
  } = usePromptMarket();
  const {
    data: customPrompts,
    isLoading: isLoadingCustom,
    error: customError,
  } = usePrompts();

  const deletePrompt = useDeletePrompt();
  const deleteMarketplacePrompt = useDeleteMarketplacePrompt();
  const [deleteTarget, setDeleteTarget] = useState<PromptResponse | null>(null);
  const [deleteMode, setDeleteMode] = useState<'custom' | 'marketplace'>(
    'custom'
  );
  const [previewTarget, setPreviewTarget] = useState<PromptResponse | null>(
    null
  );

  const isLoading = isLoadingMarket || isLoadingCustom;
  const error = marketError ?? customError;
  const isDeleting =
    deletePrompt.isPending || deleteMarketplacePrompt.isPending;

  const allPrompts = useMemo(
    () => [...(marketPrompts ?? []), ...(customPrompts ?? [])],
    [marketPrompts, customPrompts]
  );

  const { filter, setFilter, filtered } = useFilteredSearch<PromptResponse>(
    allPrompts,
    {
      searchKeys: ['name', 'description'],
      filterKey: 'type',
    }
  );

  const systemCount = allPrompts.filter(
    p => p.type === PromptType.SYSTEM
  ).length;
  const customCount = allPrompts.filter(
    p => p.type === PromptType.CUSTOM
  ).length;

  const filterTabs: FilterTab[] = [
    {
      key: FILTER_ALL,
      label: t('prompts.all', { defaultValue: 'All' }),
      count: allPrompts.length,
    },
    {
      key: PromptType.SYSTEM,
      label: t('prompts.systemPrompts'),
      count: systemCount,
    },
    {
      key: PromptType.CUSTOM,
      label: t('prompts.myPrompts'),
      count: customCount,
    },
  ];

  function handleDeleteCustom(prompt: PromptResponse) {
    setDeleteTarget(prompt);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(prompt: PromptResponse) {
    setDeleteTarget(prompt);
    setDeleteMode('marketplace');
  }

  function handleDelete(prompt: PromptResponse) {
    if (prompt.type === PromptType.SYSTEM) {
      handleDeleteMarketplace(prompt);
    } else {
      handleDeleteCustom(prompt);
    }
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const mutation =
      deleteMode === 'marketplace' ? deleteMarketplacePrompt : deletePrompt;
    mutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('prompts.deleted'));
      },
    });
  }

  const emptyTab =
    filter === PromptType.SYSTEM
      ? 'marketplace'
      : filter === PromptType.CUSTOM
        ? 'custom'
        : 'custom';

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('nav.prompts') })}
        </h3>
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('prompts.title')}
        description={t('prompts.subtitle')}
        search
      />

      <div className="flex h-10 shrink-0 items-center justify-between border-b border-border px-5">
        <FilterTabs tabs={filterTabs} value={filter} onChange={setFilter} />
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <PromptTable
              prompts={[]}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPreview={setPreviewTarget}
              loading
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <PromptCardSkeleton key={i} />
              ))}
            </div>
          )
        ) : !filtered.length ? (
          <PromptEmptyState tab={emptyTab} isAdmin={isAdmin} />
        ) : view === 'table' ? (
          <PromptTable
            prompts={filtered}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            onPreview={setPreviewTarget}
          />
        ) : (
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map(prompt => (
              <StaggerItem key={prompt.id}>
                {prompt.type === PromptType.SYSTEM ? (
                  <MarketplaceCard
                    prompt={prompt}
                    isAdmin={isAdmin}
                    onDelete={handleDeleteMarketplace}
                    onPreview={setPreviewTarget}
                  />
                ) : (
                  <PromptCard
                    prompt={prompt}
                    onDelete={handleDeleteCustom}
                    onPreview={setPreviewTarget}
                  />
                )}
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

      <PreviewDialog
        prompt={previewTarget}
        open={previewTarget !== null}
        onOpenChange={open => {
          if (!open) setPreviewTarget(null);
        }}
      />

      <DeleteDialog
        target={deleteTarget}
        mode={deleteMode}
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </div>
  );
}
