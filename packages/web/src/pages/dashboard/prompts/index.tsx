import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { PromptResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/prompts/delete-dialog';
import { MarketplaceCard } from '@/components/prompts/marketplace-card';
import { PreviewDialog } from '@/components/prompts/preview-dialog';
import { PromptCard } from '@/components/prompts/prompt-card';
import { PromptEmptyState } from '@/components/prompts/prompt-empty-state';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useDeleteMarketplacePrompt,
  useDeletePrompt,
  usePromptMarket,
  usePrompts,
} from '@/hooks/use-prompts';

export default function PromptsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
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

  function handleDeleteCustom(prompt: PromptResponse) {
    setDeleteTarget(prompt);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(prompt: PromptResponse) {
    setDeleteTarget(prompt);
    setDeleteMode('marketplace');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('nav.prompts') })}
        </h3>
        <p className="text-muted-foreground text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('prompts.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('prompts.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link to="/prompts/new?type=system">
                <Plus className="mr-2 size-4" />
                {t('prompts.addToMarketplace')}
              </Link>
            </Button>
          )}
          <Button asChild variant="primary">
            <Link to="/prompts/new">
              <Plus className="mr-2 size-4" />
              {t('prompts.createPrompt')}
            </Link>
          </Button>
        </div>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">
            {t('prompts.systemPrompts')}
          </TabsTrigger>
          <TabsTrigger value="custom">{t('prompts.myPrompts')}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {!marketPrompts || marketPrompts.length === 0 ? (
            <PromptEmptyState tab="marketplace" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {marketPrompts.map(prompt => (
                <MarketplaceCard
                  key={prompt.id}
                  prompt={prompt}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {!customPrompts || customPrompts.length === 0 ? (
            <PromptEmptyState tab="custom" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {customPrompts.map(prompt => (
                <PromptCard
                  key={prompt.id}
                  prompt={prompt}
                  onDelete={handleDeleteCustom}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

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
