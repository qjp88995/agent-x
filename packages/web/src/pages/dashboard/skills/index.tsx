import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  type FilterTab,
  FilterTabs,
  StaggerItem,
  StaggerList,
  ViewToggle,
} from '@agent-x/design';
import type { SkillResponse } from '@agent-x/shared';
import { SkillType } from '@agent-x/shared';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

import { AddCard } from '@/components/shared/add-card';
import { ListPageHeader } from '@/components/shared/list-page-header';
import { DeleteDialog } from '@/components/skills/delete-dialog';
import { MarketplaceCard } from '@/components/skills/marketplace-card';
import { PreviewDialog } from '@/components/skills/preview-dialog';
import { SkillCard } from '@/components/skills/skill-card';
import { SkillEmptyState } from '@/components/skills/skill-empty-state';
import { useIsAdmin } from '@/hooks/use-auth';
import { FILTER_ALL, useFilteredSearch } from '@/hooks/use-filtered-search';
import {
  useDeleteMarketplaceSkill,
  useDeleteSkill,
  useSkillMarket,
  useSkills,
} from '@/hooks/use-skills';
import { useViewMode } from '@/hooks/use-view-mode';

import { SkillTable } from './skill-table';

export default function SkillsPage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [view, setView] = useViewMode('skills');

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

  const allSkills = useMemo(
    () => [...(marketSkills ?? []), ...(customSkills ?? [])],
    [marketSkills, customSkills]
  );

  const { search, setSearch, filter, setFilter, filtered } =
    useFilteredSearch<SkillResponse>(allSkills, {
      searchKeys: ['name', 'description'],
      filterKey: 'type',
    });

  const systemCount = allSkills.filter(s => s.type === SkillType.SYSTEM).length;
  const customCount = allSkills.filter(s => s.type === SkillType.CUSTOM).length;

  const filterTabs: FilterTab[] = [
    {
      key: FILTER_ALL,
      label: t('skills.all', { defaultValue: 'All' }),
      count: allSkills.length,
    },
    {
      key: SkillType.SYSTEM,
      label: t('skills.systemSkills'),
      count: systemCount,
    },
    { key: SkillType.CUSTOM, label: t('skills.mySkills'), count: customCount },
  ];

  function handleDeleteCustom(skill: SkillResponse) {
    setDeleteTarget(skill);
    setDeleteMode('custom');
  }

  function handleDeleteMarketplace(skill: SkillResponse) {
    setDeleteTarget(skill);
    setDeleteMode('marketplace');
  }

  function handleDelete(skill: SkillResponse) {
    if (skill.type === SkillType.SYSTEM) {
      handleDeleteMarketplace(skill);
    } else {
      handleDeleteCustom(skill);
    }
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

  const showMarketplaceAddCard =
    isAdmin && (filter === FILTER_ALL || filter === SkillType.SYSTEM);
  const showCustomAddCard =
    filter === FILTER_ALL || filter === SkillType.CUSTOM;

  const emptyTab =
    filter === SkillType.SYSTEM
      ? 'marketplace'
      : filter === SkillType.CUSTOM
        ? 'custom'
        : 'custom';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-foreground-muted text-sm">
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
        <p className="text-foreground-muted text-sm">
          {t('common.tryRefreshing')}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <ListPageHeader
        title={t('skills.title')}
        subtitle={t('skills.subtitle')}
        search={{
          value: search,
          onChange: setSearch,
          placeholder: t('skills.searchPlaceholder', {
            defaultValue: 'Search skills...',
          }),
        }}
        trailing={<ViewToggle value={view} onChange={setView} />}
      />

      <FilterTabs
        tabs={filterTabs}
        value={filter}
        onChange={setFilter}
        className="px-1"
      />

      {!filtered.length ? (
        <SkillEmptyState tab={emptyTab} isAdmin={isAdmin} />
      ) : view === 'table' ? (
        <SkillTable
          skills={filtered}
          isAdmin={isAdmin}
          onDelete={handleDelete}
          onPreview={setPreviewTarget}
        />
      ) : (
        <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {showMarketplaceAddCard && (
            <StaggerItem>
              <AddCard
                to="/skills/new?type=system"
                label={t('skills.addToMarketplace')}
              />
            </StaggerItem>
          )}
          {showCustomAddCard && (
            <StaggerItem>
              <AddCard to="/skills/new" label={t('skills.createSkill')} />
            </StaggerItem>
          )}
          {filtered.map(skill => (
            <StaggerItem key={skill.id}>
              {skill.type === SkillType.SYSTEM ? (
                <MarketplaceCard
                  skill={skill}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                  onPreview={setPreviewTarget}
                />
              ) : (
                <SkillCard
                  skill={skill}
                  onDelete={handleDeleteCustom}
                  onPreview={setPreviewTarget}
                />
              )}
            </StaggerItem>
          ))}
        </StaggerList>
      )}

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
