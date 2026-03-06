import { type FormEvent, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';

import { AlertTriangle, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateSkill, useSkill, useUpdateSkill } from '@/hooks/use-skills';

export default function SkillEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const { data: existingSkill, isLoading: isLoadingSkill } = useSkill(id);
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [content, setContent] = useState('');

  // Pre-fill form when editing
  useEffect(() => {
    if (existingSkill) {
      setName(existingSkill.name);
      setDescription(existingSkill.description ?? '');
      setTagsInput(existingSkill.tags.join(', '));
      setContent(existingSkill.content);
    }
  }, [existingSkill]);

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  const isFormValid = name.trim().length > 0 && content.trim().length > 0;
  const isSaving = createSkill.isPending || updateSkill.isPending;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!isFormValid || isSaving) return;

    const tags = parseTags(tagsInput);

    try {
      if (isEditMode) {
        await updateSkill.mutateAsync({
          id,
          dto: {
            name: name.trim(),
            description: description.trim() || undefined,
            content: content.trim(),
            tags,
          },
        });
        toast.success(t('skills.updated'));
      } else {
        await createSkill.mutateAsync({
          name: name.trim(),
          description: description.trim() || undefined,
          content: content.trim(),
          tags,
        });
        toast.success(t('skills.created'));
      }
      await navigate('/skills');
    } catch {
      toast.error(
        isEditMode ? t('skills.updateFailed') : t('skills.createFailed')
      );
    }
  }

  if (isEditMode && isLoadingSkill) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-muted-foreground text-sm">
          {t('skills.loadingSkill')}
        </div>
      </div>
    );
  }

  if (isEditMode && !isLoadingSkill && !existingSkill) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertTriangle className="text-destructive mb-4 size-10" />
        <h3 className="mb-1 font-semibold">{t('skills.notFound')}</h3>
        <p className="text-muted-foreground mb-4 text-sm">
          {t('skills.notFoundDesc')}
        </p>
        <Button variant="outline" onClick={() => navigate('/skills')}>
          {t('skills.backToSkills')}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/skills')}
          aria-label="Back to skills"
          className="cursor-pointer"
        >
          <ArrowLeft className="size-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditMode ? t('skills.editSkill') : t('skills.createSkill')}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isEditMode
              ? t('skills.editSkillDesc')
              : t('skills.createSkillDesc')}
          </p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <CardHeader>
            <CardTitle>{t('skills.skillDetails')}</CardTitle>
            <CardDescription>{t('skills.skillDetailsDesc')}</CardDescription>
          </CardHeader>

          <CardContent className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{t('common.name')}</Label>
              <Input
                id="name"
                placeholder={t('skills.namePlaceholder')}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSaving}
                required
              />
              <p className="text-muted-foreground text-xs">
                {t('skills.nameHint')}
              </p>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="description">{t('common.description')}</Label>
              <Textarea
                id="description"
                placeholder={t('skills.descPlaceholder')}
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isSaving}
                rows={3}
              />
              <p className="text-muted-foreground text-xs">
                {t('skills.descHint')}
              </p>
            </div>

            {/* Tags */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="tags">{t('skills.tags')}</Label>
              <Input
                id="tags"
                placeholder={t('skills.tagsPlaceholder')}
                value={tagsInput}
                onChange={e => setTagsInput(e.target.value)}
                disabled={isSaving}
              />
              <p className="text-muted-foreground text-xs">
                {t('skills.tagsHint')}
              </p>
            </div>

            {/* Content */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="content">{t('skills.content')}</Label>
              <Textarea
                id="content"
                placeholder={t('skills.contentPlaceholder')}
                value={content}
                onChange={e => setContent(e.target.value)}
                disabled={isSaving}
                required
                rows={16}
                className="font-mono text-sm"
              />
              <p className="text-muted-foreground text-xs">
                {t('skills.contentHint')}
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-3 border-t pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/skills')}
              disabled={isSaving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSaving}
              className="gradient-bg text-white hover:opacity-90 cursor-pointer"
            >
              {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
              {isEditMode ? t('common.save') : t('skills.createSkill')}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
