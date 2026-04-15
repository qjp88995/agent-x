import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, PageHeader } from '@agent-x/design';
import type { PromptResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/prompts/delete-dialog';
import { PreviewDialog } from '@/components/prompts/preview-dialog';
import { PromptEmptyState } from '@/components/prompts/prompt-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeletePrompt, usePrompts } from '@/hooks/use-prompts';

import { PromptTable } from './prompt-table';

export default function PromptsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  const { data: prompts, isLoading, error } = usePrompts();

  const deletePrompt = useDeletePrompt();
  const [deleteTarget, setDeleteTarget] = useState<PromptResponse | null>(null);
  const [previewTarget, setPreviewTarget] = useState<PromptResponse | null>(
    null
  );

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

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <PromptTable
            prompts={[]}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            loading
          />
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
        ) : (
          <>
            <PromptTable
              prompts={filtered}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPreview={setPreviewTarget}
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
