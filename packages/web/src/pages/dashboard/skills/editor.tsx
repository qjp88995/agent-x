import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  PageHeader,
  Separator,
  Textarea,
} from '@agent-x/design';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { AutoFillButton } from '@/components/shared/auto-fill-button';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptEditor } from '@/components/shared/prompt-editor';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { LoadingState, NotFoundState } from '@/components/shared/status-states';
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
      await navigate(isSystemMode ? '/marketplace?tab=skills' : '/skills');
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

  if (isEditMode && isLoadingSkill) {
    return <LoadingState message={t('skills.loadingSkill')} />;
  }

  if (isEditMode && !isLoadingSkill && !existingSkill) {
    return (
      <NotFoundState
        title={t('skills.notFound')}
        description={t('skills.notFoundDesc')}
        backLabel={t('skills.backToSkills')}
        backTo={isSystemMode ? '/marketplace?tab=skills' : '/skills'}
      />
    );
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        leading={
          <Button
            variant="ghost"
            size="icon"
            className="size-7"
            onClick={() =>
              navigate(isSystemMode ? '/marketplace?tab=skills' : '/skills')
            }
            aria-label={t('skills.backToSkills')}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={pageTitle}
      />
      <div className="flex-1 overflow-auto p-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-6 lg:flex-row">
              {/* Left: Basic Info */}
              <div className="flex w-full flex-col gap-6 lg:w-1/2">
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
              </div>

              {/* Right: Skill Content */}
              <div className="flex min-h-96 w-full flex-col gap-3 lg:min-h-0 lg:w-1/2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      {t('skills.content')}
                    </h3>
                    <p className="text-foreground-muted text-xs">
                      {t('skills.contentHint')}
                    </p>
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
                </div>
                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 flex-col">
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
              </div>
            </div>

            {/* Footer */}
            <Separator />
            <div className="flex items-center gap-3">
              <div className="flex-1" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  navigate(isSystemMode ? '/marketplace?tab=skills' : '/skills')
                }
                disabled={isSaving}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                size="sm"
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
