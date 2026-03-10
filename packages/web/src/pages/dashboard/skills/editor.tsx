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

import { AutoFillButton } from '@/components/shared/auto-fill-button';
import { PageHeader } from '@/components/shared/page-header';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptEditor } from '@/components/shared/prompt-editor';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { LoadingState, NotFoundState } from '@/components/shared/status-states';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

  function handleContentChange(content: string) {
    form.setValue('content', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
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
    <div className="-m-6 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <PageHeader
          backTo="/skills"
          backLabel={t('skills.backToSkills')}
          title={pageTitle}
          description={pageDescription}
        />

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex min-h-0 flex-1 flex-col gap-6"
          >
            <div className="flex min-h-0 flex-1 gap-6">
              {/* Left: Basic Info */}
              <Card className="flex w-1/2 flex-col">
                <CardHeader>
                  <CardTitle>{t('skills.skillDetails')}</CardTitle>
                  <CardDescription>
                    {t('skills.skillDetailsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {t('common.name')}
                          <AutoFillButton
                            content={form.watch('content')}
                            fieldDescription="A short, descriptive skill name (max 30 characters). Use the same language as the input content."
                            onResult={v =>
                              form.setValue('name', v, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            disabled={isSaving}
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('skills.namePlaceholder')}
                            disabled={isSaving}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('skills.nameHint')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1">
                          {t('common.description')}
                          <AutoFillButton
                            content={form.watch('content')}
                            fieldDescription="A concise description of what this skill does (1-2 sentences). Use the same language as the input content."
                            onResult={v =>
                              form.setValue('description', v, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            disabled={isSaving}
                          />
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('skills.descPlaceholder')}
                            disabled={isSaving}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('skills.descHint')}
                        </FormDescription>
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
                        <FormDescription>
                          {t('skills.tagsHint')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Right: Skill Content */}
              <Card className="flex w-1/2 flex-col">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div className="flex flex-col gap-1.5">
                    <CardTitle>{t('skills.content')}</CardTitle>
                    <CardDescription>{t('skills.contentHint')}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <PolishButton
                      content={form.watch('content') ?? ''}
                      onApply={handleContentChange}
                      disabled={isSaving}
                    />
                    <PromptPickerButton
                      onSelect={handleContentChange}
                      disabled={isSaving}
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col">
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex min-h-0 flex-1 flex-col">
                        <FormControl>
                          <PromptEditor
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={t('skills.contentPlaceholder')}
                            disabled={isSaving}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 border-t pt-6">
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
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
