import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { SkillResponse } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { AddCard } from '@/components/shared/add-card';
import { DeleteDialog } from '@/components/skills/delete-dialog';
import { MarketplaceCard } from '@/components/skills/marketplace-card';
import { PreviewDialog } from '@/components/skills/preview-dialog';
import { SkillCard } from '@/components/skills/skill-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useDeleteMarketplaceSkill,
  useDeleteSkill,
  useSkillMarket,
  useSkills,
} from '@/hooks/use-skills';

export default function SkillsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const {
    data: marketSkills,
    isLoading: isLoadingMarket,
    error: marketError,
  } = useSkillMarket();
  const {
    data: customSkills,
    isLoading: isLoadingCustom,
    error: customError,
  } = useSkills();
  const deleteSkill = useDeleteSkill();
  const deleteMarketplaceSkill = useDeleteMarketplaceSkill();
  const [deleteTarget, setDeleteTarget] = useState<SkillResponse | null>(null);
  const [deleteMode, setDeleteMode] = useState<'custom' | 'marketplace'>(
    'custom'
  );
  const [previewTarget, setPreviewTarget] = useState<SkillResponse | null>(
    null
  );
  const isLoading = isLoadingMarket || isLoadingCustom;
  const error = marketError ?? customError;
  const isDeleting = deleteSkill.isPending || deleteMarketplaceSkill.isPending;

  function handleDeleteCustom(skill: SkillResponse) {
    setDeleteTarget(skill);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(skill: SkillResponse) {
    setDeleteTarget(skill);
    setDeleteMode('marketplace');
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const mutation =
      deleteMode === 'marketplace' ? deleteMarketplaceSkill : deleteSkill;
    mutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('skills.deleted'));
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
          {t('common.failedToLoad', { resource: t('nav.skills') })}
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
            {t('skills.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('skills.subtitle')}
          </p>
        </div>
      </div>

      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">
            {t('skills.systemSkills')}
          </TabsTrigger>
          <TabsTrigger value="custom">{t('skills.mySkills')}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isAdmin && (
              <AddCard
                to="/skills/new?type=system"
                label={t('skills.addToMarketplace')}
              />
            )}
            {marketSkills?.map(skill => (
              <MarketplaceCard
                key={skill.id}
                skill={skill}
                isAdmin={isAdmin}
                onDelete={handleDeleteMarketplace}
                onPreview={setPreviewTarget}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <AddCard to="/skills/new" label={t('skills.createSkill')} />
            {customSkills?.map(skill => (
              <SkillCard
                key={skill.id}
                skill={skill}
                onDelete={handleDeleteCustom}
                onPreview={setPreviewTarget}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <PreviewDialog
        skill={previewTarget}
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
