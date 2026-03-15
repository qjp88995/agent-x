import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  type FilterTab,
  FilterTabs,
  PageHeader,
  StaggerItem,
  StaggerList,
} from '@agent-x/design';
import type { PromptResponse, SkillResponse } from '@agent-x/shared';
import { AlertTriangle, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { MarketplaceCard as McpMarketplaceCard } from '@/components/mcp/marketplace-card';
import { MarketplaceCard as PromptMarketplaceCard } from '@/components/prompts/marketplace-card';
import { PreviewDialog as PromptPreviewDialog } from '@/components/prompts/preview-dialog';
import { MarketplaceCard as SkillMarketplaceCard } from '@/components/skills/marketplace-card';
import { PreviewDialog as SkillPreviewDialog } from '@/components/skills/preview-dialog';
import { useIsAdmin } from '@/hooks/use-auth';
import { useDeleteMarketplaceMcpServer, useMcpMarket } from '@/hooks/use-mcp';
import {
  useDeleteMarketplacePrompt,
  usePromptMarket,
} from '@/hooks/use-prompts';
import { useDeleteMarketplaceSkill, useSkillMarket } from '@/hooks/use-skills';

type TabKey = 'skills' | 'mcp' | 'prompts';

const VALID_TABS: TabKey[] = ['skills', 'mcp', 'prompts'];

function isValidTab(value: string | null): value is TabKey {
  return value !== null && VALID_TABS.includes(value as TabKey);
}

export default function MarketplacePage() {
  const { t } = useTranslation();
  const isAdmin = useIsAdmin();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: TabKey = isValidTab(tabParam) ? tabParam : 'skills';

  function setActiveTab(tab: string) {
    setSearchParams({ tab }, { replace: true });
  }

  // Data sources — all fetched on mount (React Query caches them)
  const {
    data: skills,
    isLoading: isLoadingSkills,
    error: skillsError,
  } = useSkillMarket();
  const {
    data: mcpServers,
    isLoading: isLoadingMcp,
    error: mcpError,
  } = useMcpMarket();
  const {
    data: prompts,
    isLoading: isLoadingPrompts,
    error: promptsError,
  } = usePromptMarket();

  // Delete mutations
  const deleteSkill = useDeleteMarketplaceSkill();
  const deleteMcp = useDeleteMarketplaceMcpServer();
  const deletePrompt = useDeleteMarketplacePrompt();

  // Delete state — tracks which tab the item belongs to
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    name: string;
    tab: TabKey;
  } | null>(null);

  // Preview state
  const [previewSkill, setPreviewSkill] = useState<SkillResponse | null>(null);
  const [previewPrompt, setPreviewPrompt] = useState<PromptResponse | null>(
    null
  );

  // Tab definitions with counts
  const filterTabs: FilterTab[] = [
    {
      key: 'skills',
      label: t('marketplace.tabs.skills'),
      count: skills?.length ?? 0,
    },
    {
      key: 'mcp',
      label: t('marketplace.tabs.mcp'),
      count: mcpServers?.length ?? 0,
    },
    {
      key: 'prompts',
      label: t('marketplace.tabs.prompts'),
      count: prompts?.length ?? 0,
    },
  ];

  // Create button config per tab (admin only)
  const createConfig: Record<TabKey, { label: string; href: string }> = {
    skills: {
      label: t('marketplace.addSkill'),
      href: '/skills/new?type=system',
    },
    mcp: {
      label: t('marketplace.addMcp'),
      href: '/mcp-servers/new?type=official',
    },
    prompts: {
      label: t('marketplace.addPrompt'),
      href: '/prompts/new?type=system',
    },
  };

  // Current tab state
  const isLoading =
    activeTab === 'skills'
      ? isLoadingSkills
      : activeTab === 'mcp'
        ? isLoadingMcp
        : isLoadingPrompts;
  const error =
    activeTab === 'skills'
      ? skillsError
      : activeTab === 'mcp'
        ? mcpError
        : promptsError;
  const currentCreate = createConfig[activeTab];
  const isDeleting =
    deleteSkill.isPending || deleteMcp.isPending || deletePrompt.isPending;

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    const mutation =
      deleteTarget.tab === 'skills'
        ? deleteSkill
        : deleteTarget.tab === 'mcp'
          ? deleteMcp
          : deletePrompt;
    mutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast.success(t('common.deleted'));
      },
    });
  }

  if (error) {
    return (
      <div className="flex h-full flex-col">
        <PageHeader
          title={t('marketplace.title')}
          description={t('marketplace.subtitle')}
        />
        <div className="flex flex-1 flex-col items-center justify-center py-16">
          <AlertTriangle className="text-destructive mb-4 size-10" />
          <h3 className="mb-1 font-semibold">
            {t('common.failedToLoad', { resource: t('marketplace.title') })}
          </h3>
          <p className="text-foreground-muted text-sm">
            {t('common.tryRefreshing')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={t('marketplace.title')}
        description={t('marketplace.subtitle')}
        search
        actions={
          isAdmin ? (
            <Button variant="primary" asChild>
              <Link to={currentCreate.href}>
                <Plus />
                {currentCreate.label}
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* Tab bar — no ViewToggle (marketplace only supports grid for now) */}
      <div className="flex h-10 shrink-0 items-center border-b border-border px-5">
        <FilterTabs
          tabs={filterTabs}
          value={activeTab}
          onChange={setActiveTab}
        />
      </div>

      <div className="flex-1 overflow-auto p-5">
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-surface-secondary h-32 animate-pulse rounded-lg"
              />
            ))}
          </div>
        ) : activeTab === 'skills' ? (
          !skills?.length ? (
            <EmptyMarketplace message={t('marketplace.emptySkills')} />
          ) : (
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {skills.map(skill => (
                <StaggerItem key={skill.id}>
                  <SkillMarketplaceCard
                    skill={skill}
                    isAdmin={isAdmin}
                    onDelete={s =>
                      setDeleteTarget({ id: s.id, name: s.name, tab: 'skills' })
                    }
                    onPreview={setPreviewSkill}
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          )
        ) : activeTab === 'mcp' ? (
          !mcpServers?.length ? (
            <EmptyMarketplace message={t('marketplace.emptyMcp')} />
          ) : (
            <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mcpServers.map(server => (
                <StaggerItem key={server.id}>
                  <McpMarketplaceCard
                    server={server}
                    isAdmin={isAdmin}
                    onDelete={s =>
                      setDeleteTarget({ id: s.id, name: s.name, tab: 'mcp' })
                    }
                  />
                </StaggerItem>
              ))}
            </StaggerList>
          )
        ) : !prompts?.length ? (
          <EmptyMarketplace message={t('marketplace.emptyPrompts')} />
        ) : (
          <StaggerList className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {prompts.map(prompt => (
              <StaggerItem key={prompt.id}>
                <PromptMarketplaceCard
                  prompt={prompt}
                  isAdmin={isAdmin}
                  onDelete={p =>
                    setDeleteTarget({ id: p.id, name: p.name, tab: 'prompts' })
                  }
                  onPreview={setPreviewPrompt}
                />
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </div>

      {/* Delete confirmation */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.delete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('common.deleteConfirm', { name: deleteTarget?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview dialogs */}
      <SkillPreviewDialog
        skill={previewSkill}
        open={previewSkill !== null}
        onOpenChange={open => {
          if (!open) setPreviewSkill(null);
        }}
      />
      <PromptPreviewDialog
        prompt={previewPrompt}
        open={previewPrompt !== null}
        onOpenChange={open => {
          if (!open) setPreviewPrompt(null);
        }}
      />
    </div>
  );
}

function EmptyMarketplace({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <p className="text-foreground-muted text-sm">{message}</p>
    </div>
  );
}
