import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Button, PageHeader } from '@agent-x/design';
import type { SkillResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/skills/delete-dialog';
import { PreviewDialog } from '@/components/skills/preview-dialog';
import { SkillEmptyState } from '@/components/skills/skill-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeleteSkill, useSkills } from '@/hooks/use-skills';

import { SkillTable } from './skill-table';

export default function SkillsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();

  const { data: skills, isLoading, error } = useSkills();

  const deleteSkill = useDeleteSkill();
  const [deleteTarget, setDeleteTarget] = useState<SkillResponse | null>(null);
  const [previewTarget, setPreviewTarget] = useState<SkillResponse | null>(
    null
  );

  const isDeleting = deleteSkill.isPending;

  const { filtered } = useFilteredSearch<SkillResponse>(skills ?? [], {
    searchKeys: ['name', 'description'],
  });

  function handleDelete(skill: SkillResponse) {
    setDeleteTarget(skill);
  }

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteSkill.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('skills.deleted'));
      },
    });
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">
          {t('common.failedToLoad', { resource: t('nav.skills') })}
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
        title={t('skills.title')}
        description={t('skills.subtitle')}
        search
        actions={
          <Button variant="primary" asChild>
            <Link to="/skills/new">
              <Plus />
              {t('skills.createSkill')}
            </Link>
          </Button>
        }
      />

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <SkillTable
            skills={[]}
            isAdmin={isAdmin}
            onDelete={handleDelete}
            loading
          />
        ) : !filtered.length ? (
          <>
            <SkillEmptyState tab="custom" isAdmin={isAdmin} />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=skills"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        ) : (
          <>
            <SkillTable
              skills={filtered}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              onPreview={setPreviewTarget}
            />
            <div className="mt-5 text-center">
              <Link
                to="/marketplace?tab=skills"
                className="text-foreground-muted hover:text-foreground text-sm transition-colors"
              >
                {t('marketplace.browseMarketplace')} →
              </Link>
            </div>
          </>
        )}
      </div>

      <PreviewDialog
        skill={previewTarget}
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
