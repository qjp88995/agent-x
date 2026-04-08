import { useEffect, useState } from 'react';
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
  CodeEditor,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  ErrorState,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  LoadingState,
  PageHeader,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Textarea,
} from '@agent-x/design';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { AutoFillButton } from '@/components/shared/auto-fill-button';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { useIsAdmin } from '@/hooks/use-auth';
import {
  useCreateMarketplacePrompt,
  useCreatePrompt,
  useCreatePromptCategory,
  usePrompt,
  usePromptCategories,
  useUpdateMarketplacePrompt,
  useUpdatePrompt,
} from '@/hooks/use-prompts';
import { type PromptFormValues, promptSchema } from '@/lib/schemas';

export default function PromptEditorPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const isSystemMode = searchParams.get('type') === 'system';
  const isAdmin = useIsAdmin();
  const isEditMode = !!id;

  const { data: existingPrompt, isLoading: isLoadingPrompt } = usePrompt(id);
  const { data: categories } = usePromptCategories();
  const createPrompt = useCreatePrompt();
  const updatePrompt = useUpdatePrompt();
  const createMarketplace = useCreateMarketplacePrompt();
  const updateMarketplace = useUpdateMarketplacePrompt();
  const createCategory = useCreatePromptCategory();

  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptSchema),
    defaultValues: {
      name: '',
      description: '',
      categoryId: '',
      tags: '',
      content: '',
    },
    mode: 'onChange',
  });

  useEffect(() => {
    if (existingPrompt) {
      form.reset({
        name: existingPrompt.name,
        description: existingPrompt.description ?? '',
        categoryId: existingPrompt.categoryId ?? '',
        tags: existingPrompt.tags.join(', '),
        content: existingPrompt.content,
      });
    }
  }, [existingPrompt, form]);

  if (isSystemMode && !isAdmin) {
    return <Navigate to="/prompts" replace />;
  }

  function parseTags(input: string): string[] {
    return input
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  async function handleCreateCategory() {
    if (!newCategoryName.trim()) return;

    try {
      const newCategory = await createCategory.mutateAsync({
        name: newCategoryName.trim(),
      });
      form.setValue('categoryId', newCategory.id);
      toast.success(t('prompts.categoryCreated'));
      setCategoryDialogOpen(false);
      setNewCategoryName('');
    } catch {
      toast.error(t('prompts.categoryCreateFailed'));
    }
  }

  function handleContentChange(content: string) {
    form.setValue('content', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  const isSaving =
    createPrompt.isPending ||
    updatePrompt.isPending ||
    createMarketplace.isPending ||
    updateMarketplace.isPending;

  async function onSubmit(values: PromptFormValues) {
    if (isSaving) return;

    const dto = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      content: values.content.trim(),
      tags: parseTags(values.tags ?? ''),
      categoryId: values.categoryId?.trim() || undefined,
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
          await updatePrompt.mutateAsync({ id, dto });
        } else {
          await createPrompt.mutateAsync(dto);
        }
      }
      toast.success(isEditMode ? t('prompts.updated') : t('prompts.created'));
      await navigate(isSystemMode ? '/marketplace?tab=prompts' : '/prompts');
    } catch {
      toast.error(
        isEditMode ? t('prompts.updateFailed') : t('prompts.createFailed')
      );
    }
  }

  const pageTitle = isSystemMode
    ? isEditMode
      ? t('prompts.editSystemPrompt')
      : t('prompts.addSystemPromptTitle')
    : isEditMode
      ? t('prompts.editPrompt')
      : t('prompts.createPrompt');

  if (isEditMode && isLoadingPrompt) {
    return <LoadingState message={t('prompts.loadingPrompt')} />;
  }

  if (isEditMode && !isLoadingPrompt && !existingPrompt) {
    return (
      <ErrorState
        title={t('prompts.notFound')}
        description={t('prompts.notFoundDesc')}
        actionLabel={t('prompts.backToPrompts')}
        onAction={() =>
          navigate(isSystemMode ? '/marketplace?tab=prompts' : '/prompts')
        }
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
              navigate(isSystemMode ? '/marketplace?tab=prompts' : '/prompts')
            }
            aria-label={t('prompts.backToPrompts')}
          >
            <ArrowLeft className="size-3.5" />
          </Button>
        }
        title={pageTitle}
      />
      <div className="min-h-0 flex-1 flex flex-col overflow-auto p-5">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="min-h-0 flex-1 flex flex-col gap-6"
          >
            <div className="min-h-0 flex-1 flex flex-col gap-6 lg:flex-row">
              {/* Left: metadata fields */}
              <div className="flex w-full flex-col gap-6 lg:w-1/2">
                {/* Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('common.name')}
                        <AutoFillButton
                          content={form.watch('content')}
                          fieldDescription="A short, descriptive prompt template name (max 30 characters). Use the same language as the input content."
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
                          placeholder={t('prompts.namePlaceholder')}
                          disabled={isSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('prompts.nameHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Description */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1">
                        {t('common.description')}
                        <AutoFillButton
                          content={form.watch('content')}
                          fieldDescription="A concise description of what this prompt template does (1-2 sentences). Use the same language as the input content."
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
                          placeholder={t('prompts.descPlaceholder')}
                          disabled={isSaving}
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('prompts.descHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Separator />

                {/* Category */}
                <FormField
                  control={form.control}
                  name="categoryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('prompts.category')}</FormLabel>
                      <div className="flex flex-row gap-2">
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="flex-1">
                              <SelectValue
                                placeholder={t('prompts.categoryPlaceholder')}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {categories?.map(category => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => setCategoryDialogOpen(true)}
                          disabled={isSaving}
                          title={t('prompts.newCategory')}
                        >
                          <Plus className="size-4" />
                        </Button>
                      </div>
                      <FormDescription>
                        {t('prompts.categoryHint')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('prompts.tags')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('prompts.tagsPlaceholder')}
                          disabled={isSaving}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>{t('prompts.tagsHint')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right: content editor */}
              <div className="flex min-h-96 w-full flex-col gap-3 lg:min-h-0 lg:w-1/2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium">
                      {t('prompts.content')}
                    </h3>
                    <p className="text-foreground-muted text-xs">
                      {t('prompts.contentHint')}
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
                    <FormItem className="min-h-0 flex flex-1 flex-col">
                      <FormControl>
                        <CodeEditor
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t('prompts.contentPlaceholder')}
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
                  navigate(
                    isSystemMode ? '/marketplace?tab=prompts' : '/prompts'
                  )
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
                {isEditMode ? t('common.save') : t('prompts.createPrompt')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t('prompts.newCategory')}</DialogTitle>
          </DialogHeader>
          <Input
            placeholder={t('prompts.newCategoryName')}
            value={newCategoryName}
            onChange={e => setNewCategoryName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleCreateCategory();
              }
            }}
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCategoryDialogOpen(false);
                setNewCategoryName('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={() => void handleCreateCategory()}
              disabled={!newCategoryName.trim() || createCategory.isPending}
            >
              {createCategory.isPending && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              {t('common.create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
