import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  AlertTriangle,
  Eye,
  MoreHorizontal,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { SkillType } from '@agent-x/shared';
import type {
  SkillResponse,
  SkillType as SkillTypeValue,
} from '@agent-x/shared';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useDeleteSkill, useSkills } from '@/hooks/use-skills';

const TYPE_BADGE_CONFIG: Record<
  SkillTypeValue,
  { label: string; className: string }
> = {
  SYSTEM: {
    label: 'System',
    className:
      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  },
  CUSTOM: {
    label: 'Custom',
    className:
      'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  },
};

function TypeBadge({ type }: { readonly type: SkillTypeValue }) {
  const config = TYPE_BADGE_CONFIG[type];
  return (
    <Badge variant="outline" className={cn('border-0', config.className)}>
      {config.label}
    </Badge>
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
  const isCustom = skill.type === SkillType.CUSTOM;

  return (
    <Card className="flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="flex flex-col gap-1.5">
          <CardTitle className="text-base">{skill.name}</CardTitle>
          <TypeBadge type={skill.type} />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8">
              <MoreHorizontal className="size-4" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onPreview(skill)}>
              <Eye className="mr-2 size-4" />
              View Content
            </DropdownMenuItem>
            {isCustom && (
              <>
                <DropdownMenuItem asChild>
                  <Link to={`/skills/${skill.id}/edit`}>
                    <Pencil className="mr-2 size-4" />
                    Edit
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(skill)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 size-4" />
                  Delete
                </DropdownMenuItem>
              </>
            )}
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
            No description
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
            <span className="text-muted-foreground text-xs">No tags</span>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}

function EmptyState({ tab }: { readonly tab: 'system' | 'custom' }) {
  const isSystem = tab === 'system';

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
      <Sparkles className="text-muted-foreground mb-4 size-12" />
      <h3 className="mb-1 text-lg font-semibold">
        {isSystem ? 'No system skills' : 'No custom skills yet'}
      </h3>
      <p className="text-muted-foreground mb-6 text-sm">
        {isSystem
          ? 'System skills will appear here when available.'
          : 'Create your first custom skill to get started.'}
      </p>
      {!isSystem && (
        <Button asChild>
          <Link to="/skills/new">
            <Plus className="mr-2 size-4" />
            Create Skill
          </Link>
        </Button>
      )}
    </div>
  );
}

export default function SkillsPage() {
  const { data: skills, isLoading, error } = useSkills();
  const deleteSkill = useDeleteSkill();
  const [deleteTarget, setDeleteTarget] = useState<SkillResponse | null>(null);
  const [previewTarget, setPreviewTarget] = useState<SkillResponse | null>(
    null
  );

  const systemSkills = useMemo(
    () => skills?.filter(s => s.type === SkillType.SYSTEM) ?? [],
    [skills]
  );

  const customSkills = useMemo(
    () => skills?.filter(s => s.type === SkillType.CUSTOM) ?? [],
    [skills]
  );

  function handleDeleteConfirm() {
    if (!deleteTarget) return;
    deleteSkill.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
    });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">Loading skills...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">Failed to load skills</h3>
        <p className="text-muted-foreground text-sm">
          Please try refreshing the page.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground text-sm">
            Manage skill templates for your agents.
          </p>
        </div>
        <Button asChild>
          <Link to="/skills/new">
            <Plus className="mr-2 size-4" />
            Create Skill
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="system">
        <TabsList>
          <TabsTrigger value="system">System Skills</TabsTrigger>
          <TabsTrigger value="custom">My Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="system">
          {systemSkills.length === 0 ? (
            <EmptyState tab="system" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {systemSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onDelete={setDeleteTarget}
                  onPreview={setPreviewTarget}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="custom">
          {customSkills.length === 0 ? (
            <EmptyState tab="custom" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {customSkills.map(skill => (
                <SkillCard
                  key={skill.id}
                  skill={skill}
                  onDelete={setDeleteTarget}
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
              {previewTarget?.description ?? 'No description'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <pre className="whitespace-pre-wrap rounded-md bg-muted p-4 font-mono text-sm">
              {previewTarget?.content}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteTarget !== null}
        onOpenChange={open => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Skill</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deleteTarget?.name}
              &rdquo;? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteSkill.isPending}
            >
              {deleteSkill.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
