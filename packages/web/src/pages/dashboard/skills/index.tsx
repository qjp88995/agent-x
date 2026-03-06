import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { SkillResponse } from '@agent-x/shared';
import {
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useDeleteMarketplaceSkill,
  useDeleteSkill,
  useSkillMarket,
  useSkills,
} from '@/hooks/use-skills';

function MarketplaceCard({
  skill,
  isAdmin,
  onDelete,
  onPreview,
}: {
  readonly skill: SkillResponse;
  readonly isAdmin: boolean;
  readonly onDelete: (skill: SkillResponse) => void;
  readonly onPreview: (skill: SkillResponse) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader
        className={
          isAdmin
            ? 'flex flex-row items-start justify-between gap-2 space-y-0'
            : undefined
        }
      >
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{skill.name}</CardTitle>
        </div>
        {isAdmin && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <MoreHorizontal className="size-4" />
                <span className="sr-only">{t('common.actions')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onPreview(skill)}>
                <Eye className="mr-2 size-4" />
                {t('skills.viewContent')}
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to={`/skills/${skill.id}/edit?type=system`}>
                  <Pencil className="mr-2 size-4" />
                  {t('common.edit')}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(skill)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 size-4" />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {skill.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {skill.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.length > 0 ? (
            skill.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              {t('skills.noTags')}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function SkillCard({
  skill,
  onDelete,
  onPreview,
}: {
  readonly skill: SkillResponse;
  readonly onDelete: (skill: SkillResponse) => void;
  readonly onPreview: (skill: SkillResponse) => void;
}) {
  const { t } = useTranslation();

  return (
    <Card className="flex flex-col hover:shadow-md hover:border-primary/20 transition-all duration-200">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{skill.name}</CardTitle>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">{t('common.actions')}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(skill)}>
              <Eye className="mr-2 size-4" />
              {t('skills.viewContent')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/skills/${skill.id}/edit`}>
                <Pencil className="mr-2 size-4" />
                {t('common.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(skill)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 size-4" />
              {t('common.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="flex-1">
        {skill.description ? (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {skill.description}
          </p>
        ) : (
          <p className="text-muted-foreground/50 text-sm italic">
            {t('common.noDescription')}
          </p>
        )}
      </CardContent>

      <CardFooter className="border-t pt-4">
        <div className="flex flex-wrap gap-1.5">
          {skill.tags.length > 0 ? (
            skill.tags.map(tag => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))
          ) : (
            <span className="text-muted-foreground text-xs">
              {t('skills.noTags')}
            </span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({
  tab,
  isAdmin,
}: {
  readonly tab: 'marketplace' | 'custom';
  readonly isAdmin: boolean;
}) {
  const { t } = useTranslation();
  const isMarketplace = tab === 'marketplace';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <div className="gradient-bg text-white flex size-16 items-center justify-center rounded-full mb-4">
        <Sparkles className="size-8" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">
        {isMarketplace
          ? t('skills.noSystemSkills')
          : t('skills.noCustomSkills')}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isMarketplace
          ? t('skills.noSystemSkillsDesc')
          : t('skills.noCustomSkillsDesc')}
      </p>
      {isMarketplace && isAdmin && (
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/skills/new?type=system">
            <Plus className="mr-2 size-4" />
            {t('skills.addToMarketplace')}
          </Link>
        </Button>
      )}
      {!isMarketplace && (
        <Button
          asChild
          className="gradient-bg text-white hover:opacity-90 cursor-pointer"
        >
          <Link to="/skills/new">
            <Plus className="mr-2 size-4" />
            {t('skills.createSkill')}
          </Link>
        </Button>
      )}
    </div>
  );
}

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t('skills.title')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('skills.subtitle')}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link to="/skills/new?type=system">
                <Plus className="mr-2 size-4" />
                {t('skills.addToMarketplace')}
              </Link>
            </Button>
          )}
          <Button
            asChild
            className="gradient-bg text-white hover:opacity-90 cursor-pointer"
          >
            <Link to="/skills/new">
              <Plus className="mr-2 size-4" />
              {t('skills.createSkill')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="marketplace">
        <TabsList>
          <TabsTrigger value="marketplace">
            {t('skills.systemSkills')}
          </TabsTrigger>
          <TabsTrigger value="custom">{t('skills.mySkills')}</TabsTrigger>
        </TabsList>

        <TabsContent value="marketplace">
          {!marketSkills || marketSkills.length === 0 ? (
            <EmptyState tab="marketplace" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {marketSkills.map(skill => (
                <MarketplaceCard
                  key={skill.id}
                  skill={skill}
                  isAdmin={isAdmin}
                  onDelete={handleDeleteMarketplace}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {!customSkills || customSkills.length === 0 ? (
            <EmptyState tab="custom" isAdmin={isAdmin} />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {customSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onDelete={handleDeleteCustom}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Content preview dialog */}
      <Dialog
        open={previewTarget !== null}
        onOpenChange={open => {
          if (!open) setPreviewTarget(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{previewTarget?.name}</DialogTitle>
            <DialogDescription>
              {previewTarget?.description ?? t('common.noDescription')}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
              {previewTarget?.content}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">{t('common.close')}</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent variant="destructive">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteMode === 'marketplace'
                ? t('skills.deleteSystemSkill')
                : t('skills.deleteSkill')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteMode === 'marketplace'
                ? t('skills.deleteSystemConfirm', {
                    name: deleteTarget?.name,
                  })
                : t('skills.deleteConfirm', { name: deleteTarget?.name })}
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
    </div>
  );
}
