import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  PageHeader,
  Skeleton,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { PromptResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/prompts/delete-dialog';
import { PromptCard } from '@/components/prompts/prompt-card';
import { PromptEmptyState } from '@/components/prompts/prompt-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeletePrompt, usePrompts } from '@/hooks/use-prompts';
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

  const { data: prompts, isLoading, error } = usePrompts();

  const deletePrompt = useDeletePrompt();
  const [deleteTarget, setDeleteTarget] = useState<PromptResponse | null>(null);

  const isDeleting = deletePrompt.isPending;

  const { filtered } = useFilteredSearch<PromptResponse>(prompts ?? [], {
    searchKeys: ['name', 'description'],
  });

  function handleDelete(prompt: PromptResponse) {
    setDeleteTarget(prompt);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deletePrompt.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('prompts.deleted'));
      },
    });
  }

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
        actions={
          <Button variant="primary" asChild>
            <Link to="/prompts/new">
              <Plus />
              {t('prompts.createPrompt')}
            </Link>
          </Button>
        }
      />

      <div className="flex h-10 shrink-0 items-center justify-end border-b border-border px-5">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <PromptTable
              prompts={[]}
              isAdmin={isAdmin}
              onDelete={handleDelete}
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
          <>
            <PromptEmptyState tab="custom" isAdmin={isAdmin} />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=prompts"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        ) : view === 'table' ? (
          <>
            <PromptTable
              prompts={filtered}
              isAdmin={isAdmin}
              onDelete={handleDelete}
            />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=prompts"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        ) : (
          <>
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(prompt => (
                <StaggerItem key={prompt.id}>
                  <PromptCard prompt={prompt} onDelete={handleDelete} />
                </StaggerItem>
              ))}
            </StaggerList>
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=prompts"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        )}
      </div>

      <DeleteDialog
        target={deleteTarget}
        mode="custom"
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
