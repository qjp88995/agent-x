import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

import { PageHeader } from '@/components/shared/page-header';
import { PromptEditor } from '@/components/shared/prompt-editor';
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
      await navigate('/prompts');
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

  const pageDescription = isSystemMode
    ? isEditMode
      ? t('prompts.editSystemPromptDesc')
      : t('prompts.addSystemPromptDesc')
    : isEditMode
      ? t('prompts.editPromptDesc')
      : t('prompts.createPromptDesc');

  if (isEditMode && isLoadingPrompt) {
    return <LoadingState message={t('prompts.loadingPrompt')} />;
  }

  if (isEditMode && !isLoadingPrompt && !existingPrompt) {
    return (
      <NotFoundState
        title={t('prompts.notFound')}
        description={t('prompts.notFoundDesc')}
        backLabel={t('prompts.backToPrompts')}
        backTo="/prompts"
      />
    );
  }

  return (
    <div className="-m-6 flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-6 p-6">
        <PageHeader
          backTo="/prompts"
          backLabel={t('prompts.backToPrompts')}
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
                  <CardTitle>{t('prompts.promptDetails')}</CardTitle>
                  <CardDescription>
                    {t('prompts.promptDetailsDesc')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-6 overflow-y-auto">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('common.name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('prompts.namePlaceholder')}
                            disabled={isSaving}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('prompts.nameHint')}
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
                        <FormLabel>{t('common.description')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('prompts.descPlaceholder')}
                            disabled={isSaving}
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {t('prompts.descHint')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                                <SelectItem
                                  key={category.id}
                                  value={category.id}
                                >
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
                        <FormDescription>
                          {t('prompts.tagsHint')}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Right: Prompt Content */}
              <Card className="flex w-1/2 flex-col">
                <CardHeader>
                  <CardTitle>{t('prompts.content')}</CardTitle>
                  <CardDescription>{t('prompts.contentHint')}</CardDescription>
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
                            placeholder={t('prompts.contentPlaceholder')}
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
                onClick={() => navigate('/prompts')}
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
                {isEditMode ? t('common.save') : t('prompts.createPrompt')}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Create Category Dialog */}
      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
        <DialogContent size="sm">
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
