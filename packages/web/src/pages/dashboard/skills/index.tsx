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
import type { SkillResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { DeleteDialog } from '@/components/skills/delete-dialog';
import { SkillCard } from '@/components/skills/skill-card';
import { SkillEmptyState } from '@/components/skills/skill-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { useFilteredSearch } from '@/hooks/use-filtered-search';
import { useDeleteSkill, useSkills } from '@/hooks/use-skills';
import { useViewMode } from '@/hooks/use-view-mode';

import { SkillTable } from './skill-table';

function SkillCardSkeleton() {
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

export default function SkillsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [view, setView] = useViewMode('skills');

  const { data: skills, isLoading, error } = useSkills();

  const deleteSkill = useDeleteSkill();
  const [deleteTarget, setDeleteTarget] = useState<SkillResponse | null>(null);

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

      <div className="flex h-10 shrink-0 items-center justify-end border-b border-border px-5">
        <ViewToggle value={view} onChange={setView} />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          view === 'table' ? (
            <SkillTable
              skills={[]}
              isAdmin={isAdmin}
              onDelete={handleDelete}
              loading
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkillCardSkeleton key={i} />
              ))}
            </div>
          )
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
        ) : view === 'table' ? (
          <>
            <SkillTable
              skills={filtered}
              isAdmin={isAdmin}
              onDelete={handleDelete}
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
        ) : (
          <>
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.map(skill => (
                <StaggerItem key={skill.id}>
                  <SkillCard skill={skill} onDelete={handleDelete} />
                </StaggerItem>
              ))}
            </StaggerList>
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
