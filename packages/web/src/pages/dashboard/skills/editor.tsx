import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { FormCard } from '@/components/shared/form-card';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingState, NotFoundState } from '@/components/shared/status-states';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useCreateMarketplaceSkill,
  useCreateSkill,
  useSkill,
  useUpdateMarketplaceSkill,
  useUpdateSkill,
} from '@/hooks/use-skills';
import { type SkillFormValues, skillSchema } from '@/lib/schemas';

export default function SkillEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isSystemMode = searchParams.get('type') === 'system';
  const isAdmin = useIsAdmin();
  const isEditMode = !!id;

  const { data: existingSkill, isLoading: isLoadingSkill } = useSkill(id);
  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();
  const createMarketplace = useCreateMarketplaceSkill();
  const updateMarketplace = useUpdateMarketplaceSkill();

  const form = useForm<SkillFormValues>({
    resolver: zodResolver(skillSchema),
    defaultValues: { name: '', description: '', tags: '', content: '' },
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingSkill) {
      form.reset({
        name: existingSkill.name,
        description: existingSkill.description ?? '',
        tags: existingSkill.tags.join(', '),
        content: existingSkill.content,
      });
    }
  }, [existingSkill, form]);

  if (isSystemMode && !isAdmin) {
    return <Navigate to="/skills" replace />;
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  const isSaving =
    createSkill.isPending ||
    updateSkill.isPending ||
    createMarketplace.isPending ||
    updateMarketplace.isPending;

  async function onSubmit(values: SkillFormValues) {
    if (isSaving) return;

    const dto = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      content: values.content.trim(),
      tags: parseTags(values.tags ?? ''),
    };

    try {
      if (isSystemMode) {
        if (isEditMode) {
          await updateMarketplace.mutateAsync({ id, dto });
        } else {
          await createMarketplace.mutateAsync(dto);
        }
      } else {
        if (isEditMode) {
          await updateSkill.mutateAsync({ id, dto });
        } else {
          await createSkill.mutateAsync(dto);
        }
      }
      toast.success(isEditMode ? t('skills.updated') : t('skills.created'));
      await navigate('/skills');
    } catch {
      toast.error(
        isEditMode ? t('skills.updateFailed') : t('skills.createFailed')
      );
    }
  }

  const pageTitle = isSystemMode
    ? isEditMode
      ? t('skills.editSystemSkill')
      : t('skills.addSystemSkillTitle')
    : isEditMode
      ? t('skills.editSkill')
      : t('skills.createSkill');

  const pageDescription = isSystemMode
    ? isEditMode
      ? t('skills.editSystemSkillDesc')
      : t('skills.addSystemSkillDesc')
    : isEditMode
      ? t('skills.editSkillDesc')
      : t('skills.createSkillDesc');

  if (isEditMode && isLoadingSkill) {
    return <LoadingState message={t('skills.loadingSkill')} />;
  }

  if (isEditMode && !isLoadingSkill && !existingSkill) {
    return (
      <NotFoundState
        title={t('skills.notFound')}
        description={t('skills.notFoundDesc')}
        backLabel={t('skills.backToSkills')}
        backTo="/skills"
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        backTo="/skills"
        backLabel={t('skills.backToSkills')}
        title={pageTitle}
        description={pageDescription}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-6"
        >
          <FormCard
            title={t('skills.skillDetails')}
            description={t('skills.skillDetailsDesc')}
            footer={
              <>
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
                  disabled={!form.formState.isValid || isSaving}
                  variant="primary"
                >
                  {isSaving && <Loader2 className="mr-2 size-4 animate-spin" />}
                  {isEditMode ? t('common.save') : t('skills.createSkill')}
                </Button>
              </>
            }
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('skills.namePlaceholder')}
                      disabled={isSaving}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('skills.nameHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.description')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('skills.descPlaceholder')}
                      disabled={isSaving}
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('skills.descHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('skills.tags')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t('skills.tagsPlaceholder')}
                      disabled={isSaving}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('skills.tagsHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('skills.content')}</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t('skills.contentPlaceholder')}
                      disabled={isSaving}
                      rows={16}
                      className="font-mono text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>{t('skills.contentHint')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </FormCard>
        </form>
      </Form>
    </div>
  );
}
