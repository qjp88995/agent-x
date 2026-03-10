import { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Bookmark, BookOpen, Save } from 'lucide-react';
import { toast } from 'sonner';

import { PromptPickerDialog } from '@/components/prompts/prompt-picker-dialog';
import { FormFooter } from '@/components/shared/form-footer';
import { PromptEditor } from '@/components/shared/prompt-editor';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { useCreatePrompt } from '@/hooks/use-prompts';
import type { AgentFormValues } from '@/lib/schemas';

type AgentPromptTabProps = {
  form: UseFormReturn<AgentFormValues>;
  isBusy: boolean;
  isSaving: boolean;
};

function AgentPromptTab({ form, isBusy, isSaving }: AgentPromptTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const createPrompt = useCreatePrompt();
  const [pickerOpen, setPickerOpen] = useState(false);

  function handleSelectPrompt(content: string) {
    form.setValue('systemPrompt', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  async function handleSaveToMyPrompts() {
    const content = form.getValues('systemPrompt')?.trim();
    if (!content) return;

    const agentName = form.getValues('name') || 'Untitled';
    try {
      await createPrompt.mutateAsync({
        name: `${agentName} - System Prompt`,
        content,
      });
      toast.success(t('prompts.savedToMyPrompts'));
    } catch {
      toast.error(t('prompts.saveToMyPromptsFailed'));
    }
  }

  return (
    <div className="flex min-h-0 max-w-4xl flex-1 flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('agents.systemPrompt')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('agents.systemPromptDesc')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setPickerOpen(true)}
            disabled={isBusy}
          >
            <BookOpen className="mr-2 size-4" />
            {t('prompts.browseLibrary')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSaveToMyPrompts}
            disabled={
              isBusy ||
              createPrompt.isPending ||
              !form.getValues('systemPrompt')?.trim()
            }
          >
            <Bookmark className="mr-2 size-4" />
            {t('prompts.saveToMyPrompts')}
          </Button>
        </div>
      </div>

      <FormField
        control={form.control}
        name="systemPrompt"
        render={({ field }) => (
          <FormItem className="flex min-h-0 flex-1 flex-col">
            <FormControl>
              <PromptEditor
                value={field.value}
                onChange={field.onChange}
                placeholder={t('agents.systemPromptPlaceholder')}
                disabled={isBusy}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormFooter
        onCancel={() => navigate('/agents')}
        isSaving={isSaving}
        disabled={!form.formState.isValid}
        submitLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
        icon={<Save className="mr-2 size-4" />}
      />

      <PromptPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelectPrompt}
      />
    </div>
  );
}

export { AgentPromptTab };
export type { AgentPromptTabProps };
