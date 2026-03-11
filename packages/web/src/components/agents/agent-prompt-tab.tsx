import type { UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Save } from 'lucide-react';

import { FormFooter } from '@/components/shared/form-footer';
import { PolishButton } from '@/components/shared/polish-button';
import { PromptEditor } from '@/components/shared/prompt-editor';
import { PromptPickerButton } from '@/components/shared/prompt-picker-button';
import { SavePromptButton } from '@/components/shared/save-prompt-button';
import {
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import type { AgentFormValues } from '@/lib/schemas';

type AgentPromptTabProps = {
  form: UseFormReturn<AgentFormValues>;
  isBusy: boolean;
  isSaving: boolean;
};

function AgentPromptTab({ form, isBusy, isSaving }: AgentPromptTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function handleContentChange(content: string) {
    form.setValue('systemPrompt', content, {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  return (
    <div className="flex min-h-0 max-w-4xl flex-1 flex-col gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{t('agents.systemPrompt')}</h3>
          <p className="text-muted-foreground text-sm">
            {t('agents.systemPromptDesc')}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PolishButton
            content={form.watch('systemPrompt') ?? ''}
            onApply={handleContentChange}
            disabled={isBusy}
          />
          <PromptPickerButton
            onSelect={handleContentChange}
            disabled={isBusy}
          />
          <SavePromptButton
            content={form.watch('systemPrompt') ?? ''}
            defaultName={form.watch('name')}
            disabled={isBusy}
          />
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
    </div>
  );
}

export { AgentPromptTab };
export type { AgentPromptTabProps };
